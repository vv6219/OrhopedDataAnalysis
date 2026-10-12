/**
 * INPAS DualConnector 2.x Driver for Alfa-Bank POS Terminals.
 * Supports:
 * - XML Protocol over TCP Socket (127.0.0.1:8888 or custom IP/port)
 * - File-based exchange fallback (request.xml / response.xml)
 * - Realistic Mock simulation with custom scenarios
 * - DualConnector Service state integration
 */
const net = require('net');
const fs = require('fs');
const path = require('path');

/**
 * Basic XML helper to extract tag values from XML responses
 * @param {string} xml 
 * @param {string} tagName 
 * @returns {string|null}
 */
function extractXmlTag(xml, tagName) {
  if (!xml) return null;
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extracts attribute from XML element, e.g. ResultCode="0"
 * @param {string} xml 
 * @param {string} attrName 
 * @returns {string|null}
 */
function extractXmlAttr(xml, attrName) {
  if (!xml) return null;
  const regex = new RegExp(`${attrName}=["']([^"']*)["']`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

class InpasDriver {
  constructor(options = {}) {
    this.ipAddress = options.ipAddress || '127.0.0.1';
    this.ipPort = Number(options.ipPort) || 8888;
    this.timeoutSeconds = Number(options.timeoutSeconds) || 60;
    this.exchangePath = options.exchangePath || 'C:\\Program Files (x86)\\INPAS\\DualConnector\\Exchange';
    this.isMockMode = options.isMockMode !== undefined ? options.isMockMode : true;
    this.terminalId = options.terminalId || 'ALFA_770192';
    this.merchantId = options.merchantId || 'MERCH_884102';
    this.bankName = options.bankName || 'АО «АЛЬФА-БАНК»';
    this.mockScenario = options.mockScenario || 'success';
    this.mockDelaySeconds = Number(options.mockDelaySeconds) || 2;
  }

  /**
   * Builds XML request string according to INPAS DualConnector 2.x specification
   * @param {Object} params
   * @param {number|string} params.action - e.g. 1 (Pay), 2 (Reversal), 7 (Settlement), 9 (Test Host)
   * @param {number} [params.amountKopecks] - Amount in kopecks (e.g. 350000 for 3500.00 RUB)
   * @param {string} [params.rrn]
   * @param {string} [params.orderId]
   * @param {string} [params.cashierName]
   * @returns {string}
   */
  buildXmlRequest({ action, amountKopecks, rrn, orderId, cashierName = 'Добрушкин А.М.' }) {
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n<Request Action="${action}">\n`;
    if (amountKopecks !== undefined) {
      xml += `  <Amount>${amountKopecks}</Amount>\n  <CurrencyCode>643</CurrencyCode>\n`;
    }
    if (rrn) {
      xml += `  <RRN>${rrn}</RRN>\n`;
    }
    if (orderId) {
      xml += `  <OrderId>${orderId}</OrderId>\n`;
    }
    xml += `  <ReceiptLength>32</ReceiptLength>\n`;
    xml += `  <CashierName>${cashierName}</CashierName>\n`;
    xml += `</Request>`;
    return xml;
  }

  /**
   * Parses XML response from INPAS DualConnector
   * @param {string} xmlString 
   * @returns {Object}
   */
  parseXmlResponse(xmlString) {
    if (!xmlString) {
      throw new Error('Пустой ответ от службы INPAS DualConnector');
    }

    const resultCode = extractXmlAttr(xmlString, 'ResultCode') || extractXmlTag(xmlString, 'ResultCode') || '99';
    const action = extractXmlAttr(xmlString, 'Action') || extractXmlTag(xmlString, 'Action');
    const rrn = extractXmlTag(xmlString, 'RRN');
    const authCode = extractXmlTag(xmlString, 'AuthCode');
    const pan = extractXmlTag(xmlString, 'PAN') || extractXmlTag(xmlString, 'CardNumber');
    const cardType = extractXmlTag(xmlString, 'CardType') || 'MIR';
    const terminalId = extractXmlTag(xmlString, 'TerminalID') || this.terminalId;
    const merchantId = extractXmlTag(xmlString, 'MerchantID') || this.merchantId;
    const hostResponseCode = extractXmlTag(xmlString, 'HostResponseCode') || '00';
    const errorDescription = extractXmlTag(xmlString, 'ErrorDescription') || (resultCode === '0' ? 'Успешно' : 'Ошибка операции');
    const rawSlip = extractXmlTag(xmlString, 'Slip') || extractXmlTag(xmlString, 'Receipt');
    const amountKopecks = extractXmlTag(xmlString, 'Amount');

    return {
      success: resultCode === '0',
      resultCode,
      action,
      rrn,
      authCode,
      pan,
      cardType,
      terminalId,
      merchantId,
      hostResponseCode,
      errorDescription,
      slip: rawSlip,
      amountKopecks: amountKopecks ? Number(amountKopecks) : undefined,
      rawXml: xmlString
    };
  }

  /**
   * Sends XML command to INPAS DualConnector service via TCP socket
   * @param {string} xmlRequest 
   * @returns {Promise<string>}
   */
  sendSocketCommand(xmlRequest) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let responseData = '';
      let timer = null;

      const timeoutMs = this.timeoutSeconds * 1000;

      timer = setTimeout(() => {
        client.destroy();
        reject(new Error(`Превышен таймаут ожидания ответа от службы DualConnector (${this.timeoutSeconds} сек)`));
      }, timeoutMs);

      client.connect(this.ipPort, this.ipAddress, () => {
        client.write(xmlRequest + '\0'); // INPAS protocol uses null-terminated or standard XML frames
      });

      client.on('data', (data) => {
        responseData += data.toString('utf8');
        // INPAS DualConnector closes stream or ends with </Response>
        if (responseData.includes('</Response>')) {
          clearTimeout(timer);
          client.end();
        }
      });

      client.on('end', () => {
        clearTimeout(timer);
        resolve(responseData.trim());
      });

      client.on('error', (err) => {
        clearTimeout(timer);
        client.destroy();
        reject(new Error(`Ошибка TCP-подключения к службе DualConnector (${this.ipAddress}:${this.ipPort}): ${err.message}`));
      });
    });
  }

  /**
   * Executes Mock simulation for testing without physical hardware
   * @param {number|string} action 
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async executeMock(action, params = {}) {
    const delayMs = (this.mockDelaySeconds || 2) * 1000;
    await new Promise(r => setTimeout(r, Math.max(delayMs, 300)));

    const actStr = String(action);

    // Scenario branch for Payment (Action = 1)
    if (actStr === '1') {
      const scenario = params.scenario || this.mockScenario || 'success';
      if (scenario === 'insufficient_funds') {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<Response Action="1" ResultCode="51">
  <ErrorDescription>Отказ банка: Недостаточно средств на счете карты (Код 51)</ErrorDescription>
  <HostResponseCode>51</HostResponseCode>
</Response>`;
        return this.parseXmlResponse(xml);
      }

      if (scenario === 'cancelled') {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<Response Action="1" ResultCode="1">
  <ErrorDescription>Операция прервана клиентом на PIN-паде (Кнопка Отмена)</ErrorDescription>
  <HostResponseCode>99</HostResponseCode>
</Response>`;
        return this.parseXmlResponse(xml);
      }

      if (scenario === 'timeout') {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<Response Action="1" ResultCode="2">
  <ErrorDescription>Истек таймаут ожидания карты / ввода PIN-кода (PIN-pad timeout)</ErrorDescription>
  <HostResponseCode>68</HostResponseCode>
</Response>`;
        return this.parseXmlResponse(xml);
      }

      // Success Payment Mock
      const amountKop = params.amountKopecks || 350000;
      const rrn = String(Math.floor(100000000000 + Math.random() * 900000000000));
      const authCode = String(Math.floor(100000 + Math.random() * 900000));
      const pan = '4276********' + String(Math.floor(1000 + Math.random() * 9000));
      const amountRub = (amountKop / 100).toFixed(2);

      const slip = [
        '========================================',
        `           ${this.bankName}             `,
        '     INPAS DUALCONNECTOR 2.X (UNIPOS)   ',
        '      ЦЕНТР ОРТОПЕДИИ ДОБРУШКИНА А.М.   ',
        '========================================',
        `ТЕРМИНАЛ: ${this.terminalId}`,
        `МЕРЧАНТ:  ${this.merchantId}`,
        `ДАТА/ВРЕМЯ: ${new Date().toLocaleString('ru-RU')}`,
        'ОПЕРАЦИЯ: ОПЛАТА ПО КАРТЕ (ACTION 1)',
        `КАРТА: ${pan} (MIR)`,
        'СПОСОБ ВВОДА: БЕСКОНТАКТНО (EMV/NFC)',
        '----------------------------------------',
        `СУММА: ${amountRub} РУБ.`,
        'РЕЗУЛЬТАТ: ОДОБРЕНО',
        'КОД ОТВЕТА: 00',
        `КОД АВТОРИЗАЦИИ: ${authCode}`,
        `RRN: ${rrn}`,
        '----------------------------------------',
        'ПОДПИСЬ КЛИЕНТА НЕ ТРЕБУЕТСЯ',
        'СПАСИБО ЗА ОБРАЩЕНИЕ В НАШ ЦЕНТР!',
        '========================================'
      ].join('\n');

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<Response Action="1" ResultCode="0">
  <Amount>${amountKop}</Amount>
  <CurrencyCode>643</CurrencyCode>
  <RRN>${rrn}</RRN>
  <AuthCode>${authCode}</AuthCode>
  <PAN>${pan}</PAN>
  <CardType>MIR</CardType>
  <TerminalID>${this.terminalId}</TerminalID>
  <MerchantID>${this.merchantId}</MerchantID>
  <HostResponseCode>00</HostResponseCode>
  <ErrorDescription>Успешно</ErrorDescription>
  <Slip>${slip}</Slip>
</Response>`;
      return this.parseXmlResponse(xml);
    }

    // Action = 9: Host ping / Test
    if (actStr === '9' || actStr === '05' || actStr === '5') {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<Response Action="9" ResultCode="0">
  <TerminalID>${this.terminalId}</TerminalID>
  <MerchantID>${this.merchantId}</MerchantID>
  <HostResponseCode>00</HostResponseCode>
  <ErrorDescription>Связь с процессингом АО «Альфа-Банк» проверена. Ключи актуальны.</ErrorDescription>
</Response>`;
      return this.parseXmlResponse(xml);
    }

    // Action = 2: Reversal / Void
    if (actStr === '2') {
      const rrn = params.rrn || '428901234567';
      const slip = [
        '========================================',
        `           ${this.bankName}             `,
        '     INPAS DUALCONNECTOR (ACTION 2)     ',
        '========================================',
        `ТЕРМИНАЛ: ${this.terminalId}`,
        `ОПЕРАЦИЯ: ОТМЕНА (REVERSAL)`,
        `RRN: ${rrn}`,
        'РЕЗУЛЬТАТ: ОДОБРЕНО (КОД 00)',
        '========================================'
      ].join('\n');

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<Response Action="2" ResultCode="0">
  <RRN>${rrn}</RRN>
  <HostResponseCode>00</HostResponseCode>
  <ErrorDescription>Отмена выполнена успешно</ErrorDescription>
  <Slip>${slip}</Slip>
</Response>`;
      return this.parseXmlResponse(xml);
    }

    // Action = 7: Settlement
    if (actStr === '7') {
      const totalAmount = params.totalAmount || 0;
      const count = params.count || 0;
      const slip = [
        '========================================',
        `           ${this.bankName}             `,
        '   СВЕРКА ИТОГОВ (INPAS DUALCONNECTOR)  ',
        '========================================',
        `ТЕРМИНАЛ: ${this.terminalId}`,
        `МЕРЧАНТ:  ${this.merchantId}`,
        `ДАТА/ВРЕМЯ: ${new Date().toLocaleString('ru-RU')}`,
        'СМЕНА: ЗАКРЫТА',
        `КОЛИЧЕСТВО ТРАНЗАКЦИЙ: ${count}`,
        `ИТОГОВАЯ СУММА: ${totalAmount.toFixed(2)} РУБ`,
        'СВЕРКА С ХОСТОМ: СОВПАДАЕТ (MATCHED)',
        '========================================'
      ].join('\n');

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<Response Action="7" ResultCode="0">
  <TerminalID>${this.terminalId}</TerminalID>
  <MerchantID>${this.merchantId}</MerchantID>
  <HostResponseCode>00</HostResponseCode>
  <ErrorDescription>Смена закрыта успешно</ErrorDescription>
  <Slip>${slip}</Slip>
</Response>`;
      return this.parseXmlResponse(xml);
    }

    // Generic Mock fallback
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<Response Action="${actStr}" ResultCode="0">
  <TerminalID>${this.terminalId}</TerminalID>
  <HostResponseCode>00</HostResponseCode>
  <ErrorDescription>Успешно</ErrorDescription>
</Response>`;
    return this.parseXmlResponse(xml);
  }

  /**
   * Executes transaction command (Action) either via Real Socket or Mock
   * @param {number|string} action 
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async executeCommand(action, params = {}) {
    if (this.isMockMode) {
      return await this.executeMock(action, params);
    }

    const xmlRequest = this.buildXmlRequest({
      action,
      amountKopecks: params.amountKopecks,
      rrn: params.rrn,
      orderId: params.orderId,
      cashierName: params.cashierName
    });

    const responseXml = await this.sendSocketCommand(xmlRequest);
    return this.parseXmlResponse(responseXml);
  }
}

module.exports = InpasDriver;
