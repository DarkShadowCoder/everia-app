// src/components/ui/Input.js
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helper,
  icon,
  secureTextEntry,
  dark = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType,
  autoCapitalize = 'sentences',
  style,
  inputStyle,
  rightElement,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry);
  const spec = dark ? theme.inputs.dark : error ? theme.inputs.error : focused ? theme.inputs.focused : theme.inputs.default;

  return (
    <View style={[{ width: '100%' }, style]}>
      {label ? (
        <Text style={[theme.inputs.label, dark && { color: theme.colors.white }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            minHeight: multiline ? spec.height * (numberOfLines > 1 ? numberOfLines * 0.6 : 1) : spec.height,
            backgroundColor: spec.backgroundColor,
            borderColor: spec.borderColor,
            borderWidth: spec.borderWidth,
            borderRadius: spec.radius,
            paddingHorizontal: spec.paddingHorizontal,
          },
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={18} color={dark ? theme.colors.textOnDark : theme.colors.textMuted} style={{ marginRight: 10 }} />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={dark ? theme.inputs.dark.placeholderColor : theme.inputs.default.placeholderColor}
          secureTextEntry={secure}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            { color: dark ? theme.inputs.dark.color : theme.inputs.default.color, textAlignVertical: multiline ? 'top' : 'center' },
            inputStyle,
          ]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setSecure((s) => !s)} hitSlop={8}>
            <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : (
          rightElement
        )}
      </View>
      {error ? (
        <Text style={theme.inputs.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={[theme.inputs.helper, dark && { color: theme.colors.textOnDark, opacity: 0.6 }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontFamily: theme.typography.families.body, fontSize: 14, paddingVertical: 12 },
});
