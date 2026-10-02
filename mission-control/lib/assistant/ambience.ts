export function dayPhase(hour:number):"dawn"|"day"|"dusk"|"night" {return hour>=5&&hour<9?"dawn":hour>=9&&hour<17?"day":hour>=17&&hour<21?"dusk":"night";}
export function weatherMood(code:number):"clear"|"cloud"|"fog"|"rain"|"snow" {return [45,48].includes(code)?"fog":[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)?"rain":[71,73,75,77,85,86].includes(code)?"snow":code>=1&&code<=3?"cloud":"clear";}
export type WeatherPlace={name:string;latitude:number;longitude:number};
