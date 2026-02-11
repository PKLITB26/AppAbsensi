import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Berdasarkan standard screen size
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const wp = (percentage: number) => {
  return (width * percentage) / 100;
};

export const hp = (percentage: number) => {
  return (height * percentage) / 100;
};

export const scale = (size: number) => (width / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
