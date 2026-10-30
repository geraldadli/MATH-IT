"""One A4 proposal page with four readable, simplified wireframes."""
from pathlib import Path
import shutil
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import black
import build_sketches as sketches

ROOT=Path(__file__).resolve().parent
OUT=ROOT.parents[1]/'output'
FIG=OUT/'wireframes';FIG.mkdir(exist_ok=True)
pdfmetrics.registerFont(TTFont('Proposal','C:/Windows/Fonts/times.ttf'))
pdfmetrics.registerFont(TTFont('ProposalBold','C:/Windows/Fonts/timesbd.ttf'))
d=sketches.Drawing('proposal-overview','Wireframe',1040,1000)

def label(x,y,s,size=22,bold=False,align='left'):
    d.text(x,y,s,size,bold,align)

def frame(x,y,title):
    label(x,y+26,title,25,True)
    d.rect(x,y+47,500,404,2.1)
    label(x+17,y+80,'Math It!',22,True)
    label(x+420,y+79,'ID / EN',17,align='right')
    d.icon_button(x+445,y+57,37,29,'profile')
    d.line(x,y+96,x+500,y+96)

# One consistent set of essential labels; no repeated reassurance or helper copy.
x,y=8,5;frame(x,y,'01  Halaman awal')
label(x+20,y+143,'Crack the clue.',25,True)
label(x+20,y+178,'Math it through!',25,True)
d.placeholder(x+20,y+203,215,211,'ILUSTRASI')
d.rect(x+254,y+116,226,307)
label(x+273,y+151,'Nama detektif',20)
d.rect(x+271,y+167,190,34,1.4)
label(x+273,y+232,'Pilih partner',20)
for i in range(3):d.placeholder(x+271+i*68,y+248,54,54,'')
label(x+273,y+337,'Warna',20)
for i in range(3):d.circle(x+285+i*41,y+359,10)
d.icon_button(x+271,y+384,190,27,'arrow','Mulai',size=18)

x,y=532,5;frame(x,y,'02  Berkas kasus')
label(x+20,y+137,'Halo, Detektif!',24,True)
label(x+480,y+135,'XP / Level',18,align='right')
for i,title in enumerate(['Bilangan','Aljabar','Geometri','Data']):
    px=x+20+i*120;d.rect(px,y+158,108,53,1.4)
    label(px+54,y+192,title,18,align='center')
d.rect(x+20,y+231,460,111,1.7)
label(x+35,y+263,'Kasus berikutnya',18)
label(x+35,y+294,'Biskuit yang hilang',23,True)
d.icon_button(x+35,y+309,143,24,'arrow','Buka kasus',size=17)
d.placeholder(x+370,y+247,91,78,'')
label(x+20,y+376,'Selanjutnya',20)
for i in range(2):
    d.rect(x+20+i*238,y+391,222,42,1.4)
    d.icon(x+35+i*238,y+402,'lock',22)
    label(x+133+i*238,y+420,'Kasus 0'+str(i+2),18,align='center')

x,y=8,507;frame(x,y,'03  Ruang penyelidikan')
label(x+20,y+136,'Biskuit yang hilang',25,True)
label(x+20,y+168,'Bagi 12 biskuit ke 3 kantong.',20)
d.rect(x+20,y+190,460,79,1.5)
label(x+31,y+216,'Petunjuk',18)
for i in range(12):d.circle(x+39+i*38,y+245,9)
for i,bag in enumerate(['A','B','C']):
    px=x+20+i*156;d.rect(px,y+288,147,76,1.5)
    label(px+73,y+318,'Kantong '+bag,18,align='center')
d.icon_button(x+20,y+390,44,37,'undo')
d.icon_button(x+82,y+390,44,37,'reset')
d.icon_button(x+144,y+390,44,37,'hint')
d.button(x+355,y+390,125,37,'Periksa',None,18)

x,y=532,507;frame(x,y,'04  Eksplorasi data')
label(x+20,y+136,'Dasbor hari olahraga',24,True)
label(x+20,y+168,'Lomba mana dengan poin tertinggi?',20)
for i,icon in enumerate(['group','filter','sort','view']):
    px=x+20+i*120
    d.icon_button(px,y+188,108,38,icon)
    if i<3:d.icon(px+84,y+202,'chevron',13)
d.rect(x+20,y+246,460,120,1.5)
for i,(title,w) in enumerate([('Lari',99),('Karung',231),('Tarik',132)]):
    yy=y+267+i*31
    label(x+32,yy+16,title,17)
    d.rect(x+137,yy,w,17,1.3)
d.line(x+137,y+361,x+461,y+361,1)
d.icon_button(x+20,y+390,44,37,'reset')
d.button(x+355,y+390,125,37,'Periksa',None,18)

svg=d.svg()
(FIG/'Math-It-Wireframe-Proposal.svg').write_text(svg,encoding='utf-8')
(FIG/'Math-It-Wireframe-Proposal.html').write_text('<!doctype html><html lang="id"><meta charset="utf-8"><title>Math It Wireframe</title><style>body{margin:0}svg{display:block;width:100%;height:auto}</style>'+svg+'</html>',encoding='utf-8')

W,H=A4;m=70.85
c=canvas.Canvas(str(OUT/'pdf'/'Math-It-Wireframe-Proposal.pdf'),pagesize=A4,pageCompression=1)
c.setTitle('Math It - One page proposal wireframe')
c.setAuthor('Math It!')
c.setFillColor(black);c.setFont('ProposalBold',14);c.drawString(m,H-m,'4.2 Wireframe')
intro='Empat layar utama memperlihatkan alur dari pembuatan profil hingga penyelesaian kasus matematika.'
style=ParagraphStyle('intro',fontName='Proposal',fontSize=11,leading=14,textColor=black)
p=Paragraph(intro,style);pw,ph=p.wrap(W-2*m,100);p.drawOn(c,m,H-m-18-ph)
top=H-m-18-ph-16
scale=(W-2*m)/d.w
bottom=top-d.h*scale
d.pdf(c,m,bottom,scale)
caption='Gambar 2. Wireframe layar utama Math It.'
c.setFont('Proposal',10);c.drawString(m,bottom-11,caption)
summary='Bantuan diberikan di dalam ruang kerja. Hasil pemeriksaan menampilkan arahan perbaikan atau membuka kasus berikutnya.'
p=Paragraph(summary,style);pw,ph=p.wrap(W-2*m,100);p.drawOn(c,m,bottom-26-ph)
assert bottom-26-ph>=m,'Content exceeds the proposal page area'
c.showPage();c.save()
shutil.copy2(OUT/'pdf'/'Math-It-Wireframe-Proposal.pdf',ROOT/'proposal.pdf')
print('Created one A4 page, four simplified wireframes and an editable SVG.')
