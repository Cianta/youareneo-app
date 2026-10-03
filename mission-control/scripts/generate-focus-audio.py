"""Generate original, quiet ambient loops; requires Python and ffmpeg. No external samples."""
from pathlib import Path
import math,wave,struct,random,subprocess,tempfile
root=Path(__file__).resolve().parents[1]/'public'/'audio'
root.mkdir(parents=True,exist_ok=True)
rate=16000;duration=40
with tempfile.TemporaryDirectory() as tmp:
 for name,freqs in [('work',[130.81,196.0,261.63,329.63]),('rest',[110.,164.81,220.,277.18])]:
  rng=random.Random(45 if name=='work' else 10);noise=0
  source=Path(tmp)/(name+'.wav')
  with wave.open(str(source),'wb') as out:
   out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate)
   for n in range(rate*duration):
    t=n/rate;fade=min(1,t/4,(duration-t)/4);noise=.98*noise+.02*rng.uniform(-1,1)
    v=sum(math.sin(2*math.pi*f*t+.08*math.sin(2*math.pi*.05*t+i))*(.65+.35*math.sin(2*math.pi*(i+1)/duration*t)) for i,f in enumerate(freqs))/len(freqs)
    out.writeframesraw(struct.pack('<h',int((v*.15+noise*.04)*fade*32767)))
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-c:a','libmp3lame','-b:a','48k',str(root/('trinity-'+name+'.mp3'))],check=True)
