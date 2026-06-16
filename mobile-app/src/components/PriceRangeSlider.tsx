import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, PanResponder } from 'react-native';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (val: [number, number]) => void;
}

export default function PriceRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
}: PriceRangeSliderProps) {
  const [minInput, setMinInput] = useState(value[0].toString());
  const [maxInput, setMaxInput] = useState(value[1].toString());
  const [sliderWidth, setSliderWidth] = useState(0);

  // Keep track of latest props and state to avoid stale closures in PanResponder callbacks
  const latestPropsAndState = useRef({
    value,
    min,
    max,
    step,
    sliderWidth,
  });

  useEffect(() => {
    latestPropsAndState.current = {
      value,
      min,
      max,
      step,
      sliderWidth,
    };
    setMinInput(value[0].toString());
    setMaxInput(value[1].toString());
  }, [value, min, max, step, sliderWidth]);

  const handleMinChange = (text: string) => {
    setMinInput(text);
    const num = Number(text);
    if (!isNaN(num) && num >= min && num <= value[1]) {
      onChange([num, value[1]]);
    }
  };

  const handleMaxChange = (text: string) => {
    setMaxInput(text);
    const num = Number(text);
    if (!isNaN(num) && num <= max && num >= value[0]) {
      onChange([value[0], num]);
    }
  };

  const initialValueRef = useRef<number>(0);

  const snapToStep = (val: number, stepVal: number) => {
    return Math.round(val / stepVal) * stepVal;
  };

  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        initialValueRef.current = latestPropsAndState.current.value[0];
      },
      onPanResponderMove: (evt, gestureState) => {
        const { min, max, step, sliderWidth, value } = latestPropsAndState.current;
        if (sliderWidth <= 0) return;
        const deltaValue = (gestureState.dx / sliderWidth) * (max - min);
        let newValue = initialValueRef.current + deltaValue;
        newValue = snapToStep(newValue, step);
        newValue = Math.max(min, Math.min(newValue, value[1]));
        onChange([newValue, value[1]]);
      },
    })
  ).current;

  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        initialValueRef.current = latestPropsAndState.current.value[1];
      },
      onPanResponderMove: (evt, gestureState) => {
        const { min, max, step, sliderWidth, value } = latestPropsAndState.current;
        if (sliderWidth <= 0) return;
        const deltaValue = (gestureState.dx / sliderWidth) * (max - min);
        let newValue = initialValueRef.current + deltaValue;
        newValue = snapToStep(newValue, step);
        newValue = Math.max(value[0], Math.min(newValue, max));
        onChange([value[0], newValue]);
      },
    })
  ).current;

  const minPercent = (value[0] - min) / (max - min);
  const maxPercent = (value[1] - min) / (max - min);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Price Range</Text>
        <Text style={styles.valueDisplay}>
          ₹{value[0].toLocaleString()} - ₹{value[1].toLocaleString()}
        </Text>
      </View>

      {/* Slider Visuals */}
      <View style={styles.sliderContainer}>
        <View
          style={styles.trackContainer}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setSliderWidth(width);
          }}
        >
          <View style={styles.inactiveTrack} />
          <View
            style={[
              styles.activeTrack,
              {
                left: minPercent * sliderWidth,
                width: (maxPercent - minPercent) * sliderWidth,
              },
            ]}
          />
          <View
            style={[
              styles.thumbWrapper,
              { left: minPercent * sliderWidth - 22 },
            ]}
            {...minPanResponder.panHandlers}
          >
            <View style={styles.thumb} />
          </View>
          <View
            style={[
              styles.thumbWrapper,
              { left: maxPercent * sliderWidth - 22 },
            ]}
            {...maxPanResponder.panHandlers}
          >
            <View style={styles.thumb} />
          </View>
        </View>
      </View>

      {/* Manual text inputs */}
      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Text style={styles.prefix}>Min</Text>
          <TextInput
            style={styles.input}
            value={minInput}
            keyboardType="numeric"
            onChangeText={handleMinChange}
            onBlur={() => {
              const num = Math.max(min, Math.min(value[0], value[1]));
              onChange([num, value[1]]);
              setMinInput(num.toString());
            }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.inputContainer}>
          <Text style={styles.prefix}>Max</Text>
          <TextInput
            style={styles.input}
            value={maxInput}
            keyboardType="numeric"
            onChangeText={handleMaxChange}
            onBlur={() => {
              const num = Math.min(max, Math.max(value[1], value[0]));
              onChange([value[0], num]);
              setMaxInput(num.toString());
            }}
          />
        </View>
      </View>

      {/* Chips for quick values */}
      <View style={styles.chipsContainer}>
        {[
          { label: 'Under ₹2000', value: [0, 2000] },
          { label: '₹2000 - ₹5000', value: [2000, 5000] },
          { label: 'Above ₹5000', value: [5000, 10000] },
        ].map((chip) => (
          <Text
            key={chip.label}
            style={[
              styles.chip,
              value[0] === chip.value[0] && value[1] === chip.value[1] && styles.activeChip,
            ]}
            onPress={() => onChange(chip.value as [number, number])}
          >
            {chip.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  valueDisplay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#306D29',
  },
  sliderContainer: {
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
  },
  trackContainer: {
    height: 6,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  inactiveTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
  },
  activeTrack: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#306D29',
  },
  thumbWrapper: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    top: -19, // Centers 44px height wrapper over 6px height track
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#306D29',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  prefix: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '600',
    padding: 0,
  },
  divider: {
    width: 12,
    height: 1.5,
    backgroundColor: '#6b7280',
    marginHorizontal: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    fontSize: 12,
    color: '#4a5568',
    backgroundColor: 'rgba(13, 83, 14, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeChip: {
    color: '#FFFFFF',
    backgroundColor: '#306D29',
    fontWeight: '600',
  },
});
