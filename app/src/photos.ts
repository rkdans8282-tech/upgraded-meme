import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';
import { newId } from './stickers';

const MAX_W = Platform.OS === 'web' ? 1024 : 1280; // 웹은 localStorage 용량이 작아서 더 작게
const PREFIX = 'file:';

export type PickedPhoto = { photo: string; imgAspect: number };

// 사진첩에서 한 장 골라 줄여서 앱 안에 저장. 취소하면 null
export async function pickPhoto(): Promise<PickedPhoto | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  const resize = a.width && a.width > MAX_W ? [{ resize: { width: MAX_W } }] : [];
  const out = await ImageManipulator.manipulateAsync(a.uri, resize, {
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 0.8,
    base64: Platform.OS === 'web',
  });
  const imgAspect = out.width / out.height || 1;
  if (Platform.OS === 'web') return { photo: `data:image/jpeg;base64,${out.base64}`, imgAspect };
  const dir = new Directory(Paths.document, 'photos');
  dir.create({ idempotent: true });
  const name = `${newId()}.jpg`;
  await new File(out.uri).copy(new File(dir, name));
  return { photo: PREFIX + name, imgAspect };
}

// 저장된 값 → 화면에 그릴 수 있는 주소. 절대 경로는 저장하지 않고 이름만 저장함
export function photoUri(photo: string): string {
  return photo.startsWith(PREFIX) ? new File(Paths.document, 'photos', photo.slice(PREFIX.length)).uri : photo;
}
