import firebase from 'firebase/compat/app'
import 'firebase/compat/database'
import 'firebase/compat/firestore'
import 'firebase/compat/auth'



let firebaseApp = null
let dataBase = null
let firestore = null
let fireAuth = null
let fireProvider = null

export function initFirebase(config) {
  if (!config) {
    throw new Error('[quasar_resaas] Firebase config não definida.')
  }

  firebaseApp = firebase.apps.length
    ? firebase.app()
    : firebase.initializeApp(config)

  dataBase = firebaseApp.database()
  firestore = firebaseApp.firestore()
  fireAuth = firebaseApp.auth()
  fireProvider = new firebase.auth.GoogleAuthProvider()

  return {
    firebase,
    firebaseApp,
    dataBase,
    fireDatBase: dataBase,
    firestore,
    fireAuth,
    fireProvider
  }
}

export function getFirebase() {
  if (!firebaseApp) {
    throw new Error(
      '[quasar_resaas] Firebase ainda não foi inicializado.'
    )
  }

  return {
    firebase,
    firebaseApp,
    dataBase,
    fireDatBase: dataBase,
    firestore,
    fireAuth,
    fireProvider
  }
}

export {
  firebase
}

export default firebase
