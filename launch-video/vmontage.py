import sys
from PIL import Image
fs=sys.argv[2:];ims=[Image.open(f).resize((270,480)) for f in fs];cols=6;rows=(len(ims)+cols-1)//cols
m=Image.new('RGB',(270*cols,480*rows),'red')
for i,im in enumerate(ims):m.paste(im,((i%cols)*270,(i//cols)*480))
m.save(sys.argv[1])
