"""Editable pen-style wireframes: deliberately schematic, like the supplied reference."""
from pathlib import Path
from html import escape
import math, random, json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A3, landscape

ROOT=Path(__file__).resolve().parent
SKETCH=ROOT/'sketches';SKETCH.mkdir(exist_ok=True)
OUT=ROOT.parents[1]/'output'/'pdf';OUT.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Hand','C:/Windows/Fonts/comic.ttf'))
pdfmetrics.registerFont(TTFont('HandBold','C:/Windows/Fonts/comicbd.ttf'))

class Drawing:
    def __init__(self,id,title,w=1200,h=940):
        self.id=id;self.title=title;self.w=w;self.h=h;self.ops=[];self.links=[]
        self.rng=random.Random(id)
    def path(self,points,width=1.8,fill=None):
        self.ops.append(('path',points,width,fill))
    def line(self,x,y,x2,y2,width=1.7):
        dx=x2-x;dy=y2-y
        self.path([('M',x,y),('C',x+dx*.33+self.rng.uniform(-1.2,1.2),y+dy*.33+self.rng.uniform(-1.1,1.1),x+dx*.67+self.rng.uniform(-1.2,1.2),y+dy*.67+self.rng.uniform(-1.1,1.1),x2,y2)],width)
    def rect(self,x,y,w,h,width=1.9,fill='white'):
        r=self.rng
        self.path([('M',x+1,y+1),('C',x+w*.32,y+r.uniform(-2,2),x+w*.69,y+r.uniform(-2,2),x+w,y),('C',x+w+r.uniform(-2,2),y+h*.3,x+w+r.uniform(-2,2),y+h*.72,x+w,y+h),('C',x+w*.68,y+h+r.uniform(-2,2),x+w*.3,y+h+r.uniform(-2,2),x,y+h),('C',x+r.uniform(-1.8,1.8),y+h*.67,x+r.uniform(-1.8,1.8),y+h*.3,x+1,y+1),('Z',)],width,fill)
    def circle(self,x,y,r,width=1.8):
        pts=[]
        for i in range(25):
            a=i*math.pi/12;rr=r+self.rng.uniform(-.7,.7)
            pts.append(('M' if i==0 else 'L',x+math.cos(a)*rr,y+math.sin(a)*rr))
        pts.append(('Z',));self.path(pts,width,'white')
    def text(self,x,y,s,size=19,bold=False,align='left'):
        self.ops.append(('text',x,y,s,size,bold,align))
    def label(self,x,y,s,size=16):self.text(x,y,s.upper(),size)
    def placeholder(self,x,y,w,h,label='IMAGE'):
        self.rect(x,y,w,h)
        self.line(x+2,y+2,x+w-2,y+h-2,1.5);self.line(x+w-2,y+2,x+2,y+h-2,1.5)
        if label:
            tw=pdfmetrics.stringWidth(label,'Hand',14)
            self.ops.append(('white',x+(w-tw)/2-7,y+h/2-11,tw+14,24))
            self.text(x+w/2,y+h/2+7,label,14,align='center')
    def icon(self,x,y,name,size=24):
        k=size/24
        def poly(points):
            self.path([('M' if i==0 else 'L',x+a*k,y+b*k) for i,(a,b) in enumerate(points)],1.8)
        def curve(start,control):
            self.path([('M',x+start[0]*k,y+start[1]*k),('C',*[value for i,a in enumerate(control) for value in [((x if i%2==0 else y)+a*k)]])],1.8)
        if name=='profile':
            self.circle(x+12*k,y+6*k,4*k,1.7)
            curve((3,23),(3,11,21,11,21,23))
        elif name=='undo':
            poly([(7,3),(2,8),(8,12)])
            curve((3,8),(26,4,27,25,8,21))
        elif name=='reset':
            curve((5,5),(22,-1,31,21,13,23))
            curve((13,23),(1,23,-2,14,3,9))
            poly([(5,0),(5,6),(11,6)])
        elif name=='hint':
            curve((7,16),(-7,-3,31,-3,17,16))
            poly([(7,16),(8,19),(16,19),(17,16)])
            poly([(9,23),(15,23)])
        elif name=='check':poly([(3,12),(9,19),(22,4)])
        elif name=='arrow':
            poly([(2,12),(22,12)]);poly([(15,5),(22,12),(15,19)])
        elif name=='back':
            poly([(22,12),(2,12)]);poly([(9,5),(2,12),(9,19)])
        elif name=='filter':poly([(2,3),(22,3),(15,11),(15,21),(9,18),(9,11),(2,3)])
        elif name=='sort':
            for yy,xx in [(4,12),(11,9),(18,6)]:poly([(1,yy),(xx,yy)])
            poly([(19,2),(19,21)]);poly([(15,17),(19,22),(23,17)])
        elif name=='group':
            for xx,yy in [(2,2),(14,2),(2,14),(14,14)]:poly([(xx,yy),(xx+8,yy),(xx+8,yy+8),(xx,yy+8),(xx,yy)])
        elif name=='view':
            poly([(1,1),(1,23),(23,23)])
            for xx,hh in [(5,8),(12,17),(19,12)]:poly([(xx,21),(xx,21-hh),(xx+3,21-hh),(xx+3,21)])
        elif name=='lock':
            curve((6,11),(5,-1,19,-1,18,11))
            poly([(3,11),(21,11),(21,23),(3,23),(3,11)])
            poly([(12,16),(12,20)])
        elif name=='sound':
            poly([(2,9),(7,9),(13,3),(13,21),(7,15),(2,15),(2,9)])
            curve((17,6),(22,8,22,16,17,18))
        elif name=='sun':
            self.circle(x+12*k,y+12*k,5*k,1.6)
            for xx,yy,xx2,yy2 in [(12,0,12,3),(12,21,12,24),(0,12,3,12),(21,12,24,12),(3,3,5,5),(19,19,21,21),(3,21,5,19),(19,5,21,3)]:poly([(xx,yy),(xx2,yy2)])
        elif name=='chevron':poly([(5,9),(12,16),(19,9)])
    def icon_button(self,x,y,w,h,icon,label=None,to=None,size=17,accessible_label=None):
        self.rect(x,y,w,h,1.65)
        icon_size=min(25,h-10)
        if label:
            tw=pdfmetrics.stringWidth(label,'Hand',size)
            start=x+(w-icon_size-9-tw)/2
            self.icon(start,y+(h-icon_size)/2,icon,icon_size)
            self.text(start+icon_size+9,y+h/2+size*.33,label,size)
        else:self.icon(x+(w-icon_size)/2,y+(h-icon_size)/2,icon,icon_size)
        if to:self.links.append((x,y,w,h,to,accessible_label or label or icon))
    def button(self,x,y,w,h,label,to=None,size=17):
        icons={'Undo':'undo','Reset':'reset','Profile':'profile','Sound':'sound','Day':'sun','Back':'back'}
        if label in icons:
            self.icon_button(x,y,w,h,icons[label],to=to,accessible_label=label)
            return
        if label in ['Check','Periksa','Save profile']:
            self.icon_button(x,y,w,h,'check',label,to,size,accessible_label=label)
            return
        self.rect(x,y,w,h,1.65)
        self.text(x+w/2,y+h/2+size*.33,label,size,align='center')
        if to:self.links.append((x,y,w,h,to,label))
    def scribble(self,x,y,w,rows=3,gap=14):
        for i in range(rows):self.line(x,y+i*gap,x+w*(1 if i<rows-1 else .7),y+i*gap,1)
    def alpha(self,value):self.ops.append(('alpha',value))
    def header(self,mobile=False):
        if mobile:
            self.label(21,34,self.title,20)
            self.rect(20,72,self.w-40,self.h-112,2.3)
            self.text(38,112,'Math It!',22,True)
            self.button(240,89,74,31,'ID / EN',size=12)
            self.button(328,89,84,31,'Profile','profile',12)
            self.line(20,135,self.w-20,135)
            return
        self.label(35,42,self.title,24)
        self.text(1167,43,'MATH IT! / DESKTOP',14,align='right')
        self.rect(33,87,1134,808,2.6)
        self.text(59,132,'Math It!',30,True)
        self.links.append((52,101,155,47,'casebook','Home / casebook'))
        for x,w,label,to in [(685,100,'Sound',None),(802,110,'ID / EN',None),(928,80,'Day',None),(1025,116,'Profile','profile')]:
            self.button(x,104,w,35,label,to,15)
        self.line(33,157,1167,157,2)
    def footer(self,mobile=False):
        y=self.h-79 if mobile else 851
        self.line(20 if mobile else 33,y,self.w-20 if mobile else 1167,y,1.6)
        self.text(38 if mobile else 59,y+29,'Math It!',14,True)
    def greeting(self,mobile=False,solved=False):
        if mobile:
            self.text(42,180,'Hello, Detective Alex!',23,True)
            self.text(42,212,'0 / 27 cases solved',15)
            self.text(42,239,'Level 1 / Rookie',15)
            self.rect(248,226,158,10,1.1)
            return
        self.text(64,209,'Hello, Detective Alex!',32,True)
        self.rect(853,180,286,75,1.4)
        self.text(871,207,'1 / 27 solved   Level 2' if solved else '0 / 27 solved   Level 1',17)
        self.rect(872,224,175,12,1.1)
        self.text(1061,235,'XP',15)
    def svg(self):
        parts=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {self.w} {self.h}" role="img" aria-label="{escape(self.title)}"><style>text{{font-family:"Comic Sans MS",cursive;fill:#181818}} a:focus rect{{stroke:#111;stroke-width:3;stroke-dasharray:5 5;fill-opacity:.04}}a:hover rect{{fill-opacity:.025}}</style><rect width="100%" height="100%" fill="white"/>']
        opened=False
        for op in self.ops:
            if op[0]=='alpha':
                if opened:parts.append('</g>')
                parts.append(f'<g opacity="{op[1]}">');opened=True
            elif op[0]=='path':
                d=' '.join(p[0]+' '+' '.join(f'{v:.2f}' for v in p[1:]) for p in op[1])
                parts.append(f'<path d="{d}" fill="{op[3] or "none"}" stroke="#181818" stroke-width="{op[2]}" stroke-linecap="round" stroke-linejoin="round"/>')
            elif op[0]=='white':parts.append(f'<rect x="{op[1]}" y="{op[2]}" width="{op[3]}" height="{op[4]}" fill="white"/>')
            elif op[0]=='text':
                _,x,y,s,size,bold,align=op
                parts.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{700 if bold else 400}" text-anchor="{dict(left="start",center="middle",right="end")[align]}">{escape(s)}</text>')
        if opened:parts.append('</g>')
        for x,y,w,h,to,label in self.links:
            target=to+'-mobile' if self.id.endswith('-mobile') and to in ['welcome','casebook','clues','data'] else to
            parts.append(f'<a href="{target}.html" aria-label="{escape(label)}"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="white" fill-opacity="0" stroke="none" pointer-events="all"/></a>')
        parts.append('</svg>')
        return ''.join(parts)
    def pdf(self,c,x,y,scale):
        c.saveState();c.translate(x,y);c.scale(scale,scale)
        for op in self.ops:
            if op[0]=='alpha':c.setFillAlpha(op[1]);c.setStrokeAlpha(op[1])
            elif op[0]=='path':
                p=c.beginPath()
                for point in op[1]:
                    cmd,*a=point
                    if cmd=='M':p.moveTo(a[0],self.h-a[1])
                    elif cmd=='L':p.lineTo(a[0],self.h-a[1])
                    elif cmd=='C':p.curveTo(a[0],self.h-a[1],a[2],self.h-a[3],a[4],self.h-a[5])
                    elif cmd=='Z':p.close()
                c.setLineWidth(op[2]);c.setLineCap(1);c.setLineJoin(1);c.setStrokeColorRGB(.094,.094,.094)
                c.setFillColorRGB(1,1,1);c.drawPath(p,stroke=1,fill=1 if op[3] else 0)
            elif op[0]=='white':
                c.setFillColorRGB(1,1,1);c.rect(op[1],self.h-op[2]-op[4],op[3],op[4],fill=1,stroke=0)
            elif op[0]=='text':
                _,tx,ty,s,size,bold,align=op;c.setFont('HandBold' if bold else 'Hand',size);c.setFillColorRGB(.094,.094,.094)
                fn=c.drawString if align=='left' else c.drawCentredString if align=='center' else c.drawRightString
                fn(tx,self.h-ty,s)
        c.restoreState()

def setup_form(d,x,y,w,edit=False):
    d.rect(x,y,w,600,2)
    d.placeholder(x+w/2-35,y+22,70,68,'AVATAR')
    d.text(x+w/2,y+129,'Edit detective' if edit else 'Make it official',26,True,'center')
    d.label(x+28,y+171,'Detective name',16)
    d.rect(x+28,y+187,w-56,47,1.5)
    d.text(x+43,y+218,'Alex' if edit else 'Enter your name...',18)
    d.label(x+28,y+271,'Choose a partner',16)
    cw=(w-80)/3
    for i,s in enumerate(['FOX','CAT','BEAR']):
        px=x+28+i*(cw+12)
        d.placeholder(px,y+289,cw,79,'')
        d.text(px+cw/2,y+392,s,15,align='center')
    d.label(x+28,y+432,'Partner colour',16)
    for i in range(3):d.circle(x+43+i*48,y+461,15)
    d.button(x+28,y+500,w-56,51,'Save profile' if edit else 'Start investigation  ->','casebook',19)
    if not edit:d.text(x+w/2,y+580,'Saved on this device.',14,align='center')

def welcome():
    d=Drawing('welcome','01. Welcome / detective setup');d.header()
    d.label(68,221,'The little detective bureau',19)
    d.text(68,293,'Crack the clue.',42,True);d.text(68,353,'Math it through!',42,True)
    d.placeholder(68,444,495,292,'BAKERY / DETECTIVE ILLUSTRATION')
    setup_form(d,622,188,489);d.footer();return d

def casebook():
    d=Drawing('casebook','02. Casebook / choose a unit');d.header();d.greeting()
    names=[['Numbers &','operations'],['Algebra &','reasoning'],['Measurement &','geometry'],['Data analysis']]
    for i,lines in enumerate(names):
        x=64+i*273;d.rect(x,282,253,111,2 if i==0 else 1.5)
        d.label(x+14,306,f'Unit {i+1}',14)
        for j,l in enumerate(lines):d.text(x+14,332+j*24,l,19,True)
        d.text(x+229,379,f'0/{[10,5,4,8][i]}',13,align='right')
        if i==3:d.links.append((x,282,253,111,'data','Data activity example'))
    d.rect(64,419,1072,212,2)
    d.label(87,452,'Unit 1 / Case 01',15);d.text(87,501,'The missing biscuits',32,True)
    d.text(87,537,'Share 12 biscuits equally among 3 bags.',19)
    d.button(88,561,217,45,'Open case  ->','demo',19)
    d.placeholder(827,441,283,166,'CASE IMAGE')
    d.label(64,673,'Up next',20)
    for i,title in enumerate(['The secret number code','The parcel totals']):
        x=64+i*551;d.rect(x,696,521,105,1.6)
        d.text(x+18,725,f'CASE 0{i+2} / LOCKED',14);d.placeholder(x+18,740,50,43,'')
        d.text(x+87,765,title,20)
    d.text(64,833,'+ Solved cases / replay',17);d.footer();return d

def caseboard(kind='clues',muted=False):
    titles={'clues':'03. Case activity / clue sorting','demo':'04. First-use / how to move','hint':'05. Help / hint dialog','retry':'06. Retry / look again','success':'07. Success / case solved'}
    d=Drawing(kind,titles[kind])
    if muted:d.alpha(.2)
    d.header();d.greeting(solved=kind=='success')
    d.button(65,268,95,30,'Casebook','casebook',13)
    d.label(181,289,'Unit 1',14)
    for i in range(3):d.button(267+i*54,267,40,32,str(i+1),None,14)
    d.rect(64,320,1072,510,2)
    d.label(88,351,'Case 01 / Equal sharing',16)
    d.text(88,390,'The missing biscuits',30,True)
    d.text(88,421,'Share 12 biscuits equally among 3 evidence bags.',20)
    d.line(65,442,1134,442)
    d.text(88,475,'Drag or tap a clue.',16)
    d.text(1108,475,'How to move?',16,align='right');d.links.append((936,450,181,33,'demo','How to move'))
    d.rect(88,492,1024,87,1.7)
    d.label(104,515,'Clues',14)
    if kind not in ['retry','success']:
        for i in range(12):d.circle(124+i*76,550,13)
    else:d.text(1090,516,'0 left',14,align='right')
    for i,z in enumerate(['A','B','C']):
        x=88+i*349;d.rect(x,601,326,105,2 if kind=='retry' and i<2 else 1.6)
        d.text(x+16,627,'Bag '+z,19,True)
        if kind=='retry':
            for j in range([5,3,4][i]):d.circle(x+29+j*47,665,12)
            if i<2:d.text(x+308,626,'Look again',13,align='right')
        elif kind=='success':
            for j in range(4):d.circle(x+40+j*65,666,13)
    if kind in ['retry','success']:
        d.label(88,737,'Look again: share equally.' if kind=='retry' else 'Case solved! +100 XP / Level up!',16)
        d.button(930,750,181,40,'Try again' if kind=='retry' else 'Next case  ->','clues' if kind=='retry' else 'casebook',17)
        d.button(88,751,90,39,'Undo','clues',16)
        d.button(193,751,90,39,'Reset','clues',16)
    else:
        d.button(88,726,90,40,'Undo',None,16);d.button(193,726,90,40,'Reset','clues',16)
        d.button(930,726,181,40,'Check','success',18)
    d.line(66,790,1135,790,1.1)
    d.icon(91,799,'hint',24);d.links.append((80,796,100,32,'hint','Hint'))
    d.text(1111,816,'No timer.',16,align='right');d.footer()
    return d

def hint():
    d=caseboard('hint',True);d.alpha(1)
    d.rect(328,300,544,363,2.6);d.text(355,346,'A little hint',28,True)
    d.text(839,337,'X',21);d.links.append((810,311,47,42,'clues','Close hint'))
    d.label(355,387,'Hint 1 / 3',15)
    d.text(355,427,'What would an equal share look like?',18)
    d.rect(355,453,490,80,1.5)
    d.text(600,503,'A: ?     B: ?     C: ?',25,align='center')
    d.button(355,551,104,36,'Back',None,16);d.button(665,551,180,36,'Another hint',None,16)
    d.button(355,607,490,36,'Let me try','clues',18)
    return d

def demo():
    d=caseboard('demo',True);d.alpha(1)
    d.rect(290,286,620,401,2.6);d.text(321,334,'How to move a clue',29,True)
    d.text(877,324,'X',22);d.links.append((849,297,43,43,'clues','Close guide'))
    for i,title in enumerate(['DRAG','TAP TWICE']):
        x=321+i*299;d.rect(x,364,260,209,1.7);d.label(x+130,400,title,18)
        d.circle(x+65,453,17);d.line(x+93,453,x+158,453)
        d.text(x+142,461,'>',20);d.rect(x+172,432,54,45,1.5)
        d.text(x+130,522,'Hold, move, let go.' if i==0 else 'Clue, then its bag.',16,align='center')
    d.button(321,608,558,46,'Let me try','clues',20);return d

def success():
    d=caseboard('success');return d

def data():
    d=Drawing('data','08. Data activity / explore evidence');d.header();d.greeting()
    d.button(65,268,95,30,'Casebook','casebook',13);d.label(184,288,'Unit 4 / Case 08',16)
    d.rect(64,319,1072,511,2)
    d.text(88,362,'The sports day dashboard',30,True)
    d.text(88,401,'In which event did Blue team score the most points?',20)
    d.line(65,423,1135,423)
    for i,(title,value) in enumerate([('Bars show','Event v'),('Filter','Blue v'),('Sort','Normal v'),('View','Chart / Table')]):
        x=88+i*260;d.label(x,456,title,16);d.button(x,471,243,38,value,None,17)
    d.rect(88,532,1024,194,1.5);d.text(110,563,'Sports day points',19,True)
    for i,(label,value) in enumerate([('Running',15),('Sack race',35),('Tug of war',20)]):
        y=589+i*38;d.text(111,y+19,label,16);d.rect(282,y,value*19,23,1.4)
    d.line(282,708,1043,708,1.1)
    for i in range(5):d.text(282+i*190,721,str(i*10),11,align='center')
    d.text(88,754,'Tap a bar to choose your answer.',16)
    d.button(88,776,116,35,'Reset','data',16);d.button(946,776,166,35,'Check','success',17)
    d.links.append((282,626,670,29,'success','Choose Sack race'))
    d.footer();return d

def profile():
    d=casebook();d.id='profile';d.title='09. Settings / edit detective profile'
    # Retain the page underneath and make the modal the focus.
    d.ops.insert(0,('alpha',.2));d.alpha(1)
    d.ops[1]=('text',35,42,d.title.upper(),24,False,'left')
    setup_form(d,348,183,504,True)
    d.text(822,211,'X',22);d.links.append((793,190,43,40,'casebook','Close profile'))
    return d

def mobile(id):
    h=1480 if id=='clues' else 1380 if id=='data' else 1260
    titles={'welcome':'M1. Welcome / mobile','casebook':'M2. Casebook / mobile','clues':'M3. Clues / mobile','data':'M4. Data / mobile'}
    d=Drawing(id+'-mobile',titles[id],450,h);d.header(True)
    if id=='welcome':
        d.label(42,177,'Little detective bureau',14)
        d.text(42,225,'Crack the clue.',31,True);d.text(42,268,'Math it through!',31,True)
        d.placeholder(42,366,366,133,'BAKERY ILLUSTRATION')
        setup_form(d,42,538,366)
    elif id=='casebook':
        d.greeting(True)
        for i,lines in enumerate([['Numbers &','operations'],['Algebra &','reasoning'],['Measurement &','geometry'],['Data analysis']]):
            x=42+(i%2)*190;y=281+(i//2)*120
            d.rect(x,y,176,103,1.6);d.label(x+12,y+26,f'Unit {i+1}',13)
            for j,l in enumerate(lines):d.text(x+12,y+53+j*24,l,16,True)
        d.rect(42,545,366,218,1.8);d.label(59,575,'Unit 1 / Case 01',14)
        d.text(59,615,'The missing biscuits',23,True)
        d.text(59,650,'12 biscuits. 3 equal bags.',17)
        d.button(59,692,332,47,'Open case  ->','demo',18)
        d.label(42,804,'Up next',18)
        for i,name in enumerate(['The secret number code','The parcel totals']):
            y=829+i*123;d.rect(42,y,366,105,1.5);d.text(59,y+30,'LOCKED / CASE 0'+str(i+2),13)
            d.placeholder(59,y+48,47,39,'');d.text(120,y+74,name,16)
        d.text(42,1113,'+ Solved cases',17)
    elif id=='clues':
        d.greeting(True);d.button(42,268,105,31,'Casebook','casebook',13)
        d.text(175,289,'Case 01 / 02 / 03',15)
        d.rect(42,323,366,938,1.9);d.label(59,356,'Case 01 / Equal sharing',13)
        d.text(59,398,'The missing biscuits',24,True)
        d.text(59,434,'Share 12 biscuits equally',17);d.text(59,461,'among 3 evidence bags.',17)
        d.line(43,481,407,481);d.text(59,511,'Drag or tap a clue.',15)
        d.rect(59,534,332,161,1.5);d.label(74,561,'Clues',13)
        for i in range(12):d.circle(83+(i%6)*56,598+(i//6)*54,15)
        for i,bag in enumerate(['A','B','C']):
            y=721+i*136;d.rect(59,y,332,118,1.6);d.text(75,y+31,'Bag '+bag,18,True)
        d.button(59,1142,85,42,'Undo',None,16);d.button(155,1142,85,42,'Reset',None,16)
        d.button(286,1142,105,42,'Check','success',17)
        d.line(43,1210,407,1210);d.icon(65,1220,'hint',25);d.links.append((54,1217,100,35,'hint','Hint'))
        d.rect(42,1290,366,62,1.8)
        for i,bag in enumerate(['A','B','C']):d.button(55+i*119,1303,103,36,'Bag '+bag,None,15)
    else:
        d.greeting(True)
        d.rect(42,282,366,940,1.9);d.label(59,315,'Unit 4 / Case 08',13)
        d.text(59,356,'The sports day',25,True);d.text(59,392,'dashboard',25,True)
        d.text(59,433,'Which event gave Blue team',16);d.text(59,460,'the most points?',16)
        d.line(43,482,407,482)
        for i,(label,value) in enumerate([('Bars show','Event v'),('Filter','Blue v'),('Sort','Normal v'),('View','Chart / Table')]):
            x=59+(i%2)*174;y=515+(i//2)*114
            d.label(x,y,label,15);d.button(x,y+16,158,49,value,None,15)
        d.rect(59,762,332,283,1.5);d.text(75,796,'Sports day points',18,True)
        for i,(label,value) in enumerate([('Running',15),('Sack race',35),('Tug of war',20)]):
            y=831+i*58;d.text(75,y+21,label,13);d.rect(168,y,value*5.8,25,1.5)
        d.line(168,1018,377,1018)
        d.text(168,1036,'0',11);d.text(376,1036,'40',11,align='right')
        d.text(59,1082,'Tap a bar to answer.',16)
        d.button(59,1115,104,45,'Reset',None,16);d.button(286,1115,105,45,'Check','success',17)
        d.line(43,1180,407,1180);d.icon(65,1189,'hint',24)
    d.footer(True);return d

drawings=[welcome(),casebook(),caseboard(),demo(),hint(),caseboard('retry'),success(),data(),profile()]
mobiles=[mobile(s) for s in ['welcome','casebook','clues','data']]
all_drawings=drawings+mobiles
meta=[]
for d in all_drawings:
    svg=d.svg();(SKETCH/(d.id+'.svg')).write_text(svg,encoding='utf-8')
    page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'''+escape(d.title)+'''</title><style>body{margin:0;background:white}svg{display:block;width:100%;height:auto}a{cursor:pointer}</style></head><body>'''+svg+'''<script>const id='''+json.dumps(d.id)+''';if(parent!==window){parent.postMessage({type:'sketch-screen',id},'*');new ResizeObserver(()=>parent.postMessage({type:'sketch-size',height:document.querySelector('svg').getBoundingClientRect().height},'*')).observe(document.querySelector('svg'));}addEventListener('keydown',e=>{if(e.key==='Escape'&&['hint','demo','profile'].includes(id))location.href=(id==='profile'?'casebook':'clues')+'.html';});</script></body></html>'''
    (SKETCH/(d.id+'.html')).write_text(page,encoding='utf-8')
    meta.append({'id':d.id,'title':d.title,'width':d.w,'height':d.h,'links':[r[4] for r in d.links]})
(SKETCH/'manifest.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')

# Keep the proposal pages as vector line drawings, including embedded handwriting.
W,H=landscape(A3)
pdf=OUT/'Math-It-Wireframe-Reference.pdf'
c=canvas.Canvas(str(pdf),pagesize=(W,H),pageCompression=1)
c.setTitle('Math It! - Hand-drawn low-fidelity wireframes')
c.setAuthor('Math It!')
for d in drawings:
    scale=min((W-35)/d.w,(H-26)/d.h)
    d.pdf(c,(W-d.w*scale)/2,(H-d.h*scale)/2,scale)
    c.bookmarkPage(d.id);c.addOutlineEntry(d.title,d.id)
    c.showPage()
for pair in [mobiles[:2],mobiles[2:]]:
    for i,d in enumerate(pair):
        scale=(H-32)/d.h
        d.pdf(c,135+i*W/2,(H-d.h*scale)/2,scale)
    c.showPage()
c.save()
print(json.dumps({'pdf':str(pdf),'pages':11,'sketches':len(all_drawings)}))
