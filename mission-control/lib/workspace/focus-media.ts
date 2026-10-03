"use client";
import {create} from 'zustand';
export const useFocusMedia=create<{current:number;duration:number;blocked:boolean;seek:number|null;set:(patch:Partial<{current:number;duration:number;blocked:boolean;seek:number|null}>)=>void}>(set=>({current:0,duration:0,blocked:false,seek:null,set}));
