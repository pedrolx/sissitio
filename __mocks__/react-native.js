// __mocks__/react-native.js
module.exports = {
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  TouchableOpacity: 'TouchableOpacity',
  StyleSheet: { create: (styles) => styles },
  Platform: { OS: 'android' },
  NativeModules: {
    RNGestureHandlerModule: {
      attachGesturedHandler: jest.fn(),
      createGestureHandler: jest.fn(),
      dropGestureHandler: jest.fn(),
      updateGestureHandler: jest.fn(),
      flushOperations: jest.fn(),
      handleSetJSResponder: jest.fn(),
      handleClearJSResponder: jest.fn(),
    },
  },
};