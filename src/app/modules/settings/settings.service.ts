import { TSettings } from './settings.interface'
import SettingsModel from './settings.model'

const getSettingsData = async () => {
  const settings = await SettingsModel.find()
  return settings
}

const updateSettingsData = async (payload: TSettings) => {
  const result = await SettingsModel.findOneAndUpdate({}, payload, {
    new: true,
    upsert: true,
  })
  return result
}

const settingsServices = {
  getSettingsData,
  updateSettingsData,
}

export default settingsServices
