"use client";
import {useEffect,useState} from 'react';
import {AppLauncher} from '@/components/launcher/AppLauncher';
export default function MarketingPage(){const [collection,setCollection]=useState('marketing');useEffect(()=>{const c=new URLSearchParams(window.location.search).get('collection');if(c==='blogs'||c==='websites')setCollection(c);},[]);const title=collection==='blogs'?'Blogs & Inhalte':collection==='websites'?'Website & Publishing':'Marketing';return <AppLauncher pageKey={collection==='marketing'?'marketing':'outreach-'+collection} title={title} subtitle="Deine Programme und Links für diesen Bereich. Mit + verknüpfst du deine eigenen Werkzeuge."/>;}
