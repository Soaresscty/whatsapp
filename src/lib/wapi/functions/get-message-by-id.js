import { NUMBER_SUFIX } from '../constants/number-suffix'
import { normalizePhoneNumber } from '../helper/normalize-phone-number'

export async function getMessageById(
  key,
  done,
  serialize = true,
  limitIterationFindMessage = 1
) {
  // Check message is loaded in store
  let msg = window.Store.Msg.get(key)

  if (!msg) {
    const splittedKey = key.split('_')
    let chatId = splittedKey[1]

    let chat
    try {
      chat = window.Store.Chat.get(chatId)
    } catch (err) {
      return { erro: 'error trying to find chat' }
    }

    if (!chat && chatId.includes(NUMBER_SUFIX.CONTACT)) {
      chatId = `${normalizePhoneNumber(chatId.split(NUMBER_SUFIX.CONTACT)[0])}`

      try {
        chat = window.Store.Chat.get(chatId)
      } catch (err) {
        return { erro: 'error trying to find chat' }
      }
    }

    if (!chat) {
      return { erro: 'chat not found' }
    }

    let i = 0
    while (
      limitIterationFindMessage === 0 ||
      ++i <= limitIterationFindMessage
    ) {
      msg = window.Store.Msg.get(key)
      if (msg) {
        break
      }
      const msgs = await window.Store.ChatLoadMessages.loadEarlierMsgs(chat)
      if (!msgs || msgs.length === 0) {
        break
      }
    }

    if (!msg) {
      const prefix = splittedKey[0]
      const msgId = splittedKey[2]
      if (chatId.includes(NUMBER_SUFIX.CONTACT)) {
        key = `${prefix}_${normalizePhoneNumber(chatId)}_${msgId}`
      } else if (chatId.includes(NUMBER_SUFIX.GROUP)) {
        const numberPhone = splittedKey[3]
        key = `${prefix}_${chatId}_${msgId}_${normalizePhoneNumber(
          numberPhone
        )}`
      }
      msg = window.Store.Msg.get(key)
    }
  }

  if (!msg) {
    return { erro: 'message not found' }
  }

  let result = { erro: 'message not found' }

  if (serialize) {
    try {
      result = await WAPI.processMessageObj(msg, true, true)
    } catch (err) {}
  } else {
    result = msg
  }

  if (typeof done === 'function') {
    done(result)
  } else {
    return result
  }
}
