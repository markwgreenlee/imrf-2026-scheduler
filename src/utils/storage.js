import AsyncStorage from '@react-native-async-storage/async-storage';
import conference from '../config/conference';

// The three schedulers share an origin, and therefore share localStorage.
// Every key is namespaced so they cannot overwrite one another.
const key = (name) => `${conference.storagePrefix}:${name}`;

// Schedules saved before namespacing sit under the bare key, which may hold
// another app's data. Read it once, let the caller reconcile it against this
// programme (which drops anything foreign), and write it back namespaced. The
// old key is left alone so the other apps can do the same.
export const getItem = async (name) => {
  const own = await AsyncStorage.getItem(key(name));
  if (own !== null) return own;
  return AsyncStorage.getItem(name);
};

export const setItem = (name, value) => AsyncStorage.setItem(key(name), value);
