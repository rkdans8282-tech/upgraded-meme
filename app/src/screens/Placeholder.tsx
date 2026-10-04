import { StyleSheet, Text, View } from 'react-native';
import { Chick } from '../components/Chick';
import { theme } from '../theme';

export default function Placeholder({ title }: { title: string }) {
  return (
    <View style={s.root}>
      <Chick mood="sleepy" size={160} />
      <Text style={s.text}>{title}은(는) 준비 중이에요, 삐약!</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.bg, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: theme.color.text, marginTop: 12 },
});
