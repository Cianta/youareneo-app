declare module 'free-human-design' {
 export function parseBirthToUtc(input:{birthdate:string;birthtime:string;timezone:string}):Date;
 export function computeChart(input:{birthdate:string;birthtime:string;timezone:string;location?:{lat:number;lng:number}}):{
  input:{birth_utc:string};humanDesign:{type:string;authority:string;profile:string;activatedGates:number[];definedCenters:string[];definedChannels:{key:string;gates:number[];centers:string[];name:string}[];p_:Record<string,{gate:number;line:number;longitude:number}>;d_:Record<string,{gate:number;line:number;longitude:number}>};
  astrology:{angles:{ascendant:{longitude:number}}}|null;
 };
}
