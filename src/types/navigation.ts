export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Tabs: undefined;
  PinCode: undefined;
  ObjectDetails: { objectId: string };
  AddEditObject: { objectId?: string }; // undefined = создание нового
  FireSafety: { objectId: string };
  Reports: undefined;
};

export type TabParamList = {
  Home: undefined;
  Objects: undefined;
  Profile: undefined;
};