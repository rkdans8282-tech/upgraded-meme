import { SvgXml } from 'react-native-svg';
import { chickSvgs, ChickMood } from '../chickSvgs';

export function Chick({ mood = 'normal', size = 160 }: { mood?: ChickMood; size?: number }) {
  return <SvgXml xml={chickSvgs[mood]} width={size} height={size} />;
}
