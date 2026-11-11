import sys
from PIL import Image
fs=sys.argv[2:];ims=[Image.open(f).resize((640,360)) for f in fs];cols=3;rows=(len(ims)+cols-1)//cols
m=Image.new('RGB',(640*cols,360*rows),'red')
for i,im in enumerate(ims):m.paste(im,((i%cols)*640,(i//cols)*360))
m.save(sys.argv[1])
