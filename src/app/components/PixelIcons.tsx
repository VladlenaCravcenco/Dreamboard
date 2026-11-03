import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & { size?: number };
const patterns = {
  grid: ['1110111','1010101','1110111','0000000','1110111','1010101','1110111'],
  heart: ['0110110','1111111','1111111','0111110','0011100','0001000','0000000'],
  bars: ['0000011','0000011','0011011','0011011','1111011','1111011','1111011'],
  user: ['0011100','0011100','0011100','0000000','0111110','1111111','1100011'],
  moon: ['0011100','0110000','1100000','1100000','1100010','0111110','0011100'],
  sun: ['1001001','0100010','0011100','1011101','0011100','0100010','1001001'],
  plus: ['0001000','0001000','0001000','1111111','0001000','0001000','0001000'],
  search: ['0111000','1000100','1000100','1000100','0111000','0000110','0000011'],
  trash: ['0011100','1111111','0100010','0101010','0101010','0100010','0111110'],
  arrow: ['0001000','0010000','0100000','1111111','0100000','0010000','0001000'],
  check: ['0000000','0000001','0000010','1000100','0101000','0010000','0000000'],
  close: ['1000001','0100010','0010100','0001000','0010100','0100010','1000001'],
  spark: ['0001000','0001000','0011100','1111111','0011100','0001000','0001000'],
};
function icon(name: keyof typeof patterns) {
  return function PixelIcon({ size = 20, ...props }: Props) {
    return <svg width={size} height={size} viewBox="0 0 9 9" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" {...props}>{patterns[name].flatMap((row, y) => [...row].map((cell, x) => cell === '1' ? <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1" height="1"/> : null))}</svg>;
  };
}
export const LayoutGrid = icon('grid');
export const Heart = icon('heart');
export const BarChart3 = icon('bars');
export const User = icon('user');
export const Moon = icon('moon');
export const Sun = icon('sun');
export const Plus = icon('plus');
export const Search = icon('search');
export const Trash2 = icon('trash');
export const ArrowLeft = icon('arrow');
export const Check = icon('check');
export const X = icon('close');
export const Spark = icon('spark');

