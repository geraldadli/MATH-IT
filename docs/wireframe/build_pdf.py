"""Build the proposal appendix from the verified, locally rendered wireframes."""
from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from PIL import Image

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parents[1] / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / 'Math-It-Wireframe-Proposal.pdf'
for font, file in [('UI','segoeui.ttf'),('UI-Semibold','seguisb.ttf'),('UI-Light','segoeuil.ttf'),('Mono','consola.ttf')]:
    path = Path('C:/Windows/Fonts') / file
    if not path.exists() and font=='UI-Light': path=Path('C:/Windows/Fonts/segoeui.ttf')
    pdfmetrics.registerFont(TTFont(font, str(path)))

W,H=landscape(A3)
M=44
INK='#252525'; MUTED='#65655e'; LINE='#cecec5'; SOFT='#f2f2ed'
c=canvas.Canvas(str(PDF), pagesize=(W,H), pageCompression=1)
c.setTitle('Math It! | Low-fidelity wireframe proposal')
c.setAuthor('Math It!')
c.setSubject('Annotated desktop and mobile wireframes based on the existing Math It! website')
page_no=0

def text(x,y,s,size=11,font='UI',color=INK):
    c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,y,s)

def para(x,y,s,width,size=11,leading=None,color=MUTED,font='UI'):
    style=ParagraphStyle('body',fontName=font,fontSize=size,leading=leading or size*1.6,textColor=HexColor(color))
    p=Paragraph(s,style);_,h=p.wrap(width,1000);p.drawOn(c,x,y-h);return y-h

def line(x1,y1,x2,y2,color=LINE):
    c.setStrokeColor(HexColor(color));c.setLineWidth(.6);c.line(x1,y1,x2,y2)

def box(x,y,w,h,fill='#ffffff',stroke=LINE,r=0):
    c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke));c.setLineWidth(.7)
    if r:c.roundRect(x,y,w,h,r,fill=1,stroke=1)
    else:c.rect(x,y,w,h,fill=1,stroke=1)

def label(x,y,s):text(x,y,s,9,'Mono',MUTED)

def begin(title,kicker,subtitle='',bookmark=None):
    global page_no
    page_no+=1
    c.setFillColor(HexColor('#fcfcfa'));c.rect(0,0,W,H,fill=1,stroke=0)
    if bookmark:
        c.bookmarkPage(bookmark);c.addOutlineEntry(title,bookmark,level=0,closed=False)
    label(M,H-43,'MATH IT!  /  PRODUCT PROPOSAL')
    c.setFont('Mono',9);c.drawRightString(W-M,H-43,kicker)
    text(M,H-91,title,30,'UI-Semibold')
    if subtitle:para(M,H-108,subtitle,W-2*M,11)
    line(M,52,W-M,52)
    label(M,31,'LOW-FIDELITY STUDY  /  OCTOBER 2026')
    c.setFont('Mono',9);c.drawRightString(W-M,31,f'{page_no:02d}  /  MATH IT!')

def finish():c.showPage()

def image(name,x,y,maxw,maxh,outline=True):
    path=ROOT/'screens'/f'{name}.png'
    iw,ih=Image.open(path).size
    scale=min(maxw/iw,maxh/ih);w,h=iw*scale,ih*scale
    if outline:box(x,y-h,w,h)
    c.drawImage(str(path),x,y-h,width=w,height=h,mask='auto')
    return w,h

def note(x,y,n,title,body,width=220):
    label(x,y,f'{n:02d} /')
    y-=23;text(x,y,title,12,'UI-Semibold')
    return para(x,y-11,body,width,10.5)-26

notes=json.loads((ROOT/'screens'/'screen-notes.json').read_text(encoding='utf-8'))

# 01. Cover. A visual overview that can stand alone in a proposal.
begin('','WIREFRAME APPENDIX',bookmark='overview')
label(M,H-105,'GRADE 3 / PHASE B  ·  ENGLISH + BAHASA INDONESIA')
text(M,H-182,'Small mysteries.',61,'UI-Light')
text(M,H-250,'Clear learning journeys.',61,'UI-Semibold')
para(M,H-280,'A low-fidelity prototype of the existing Math It! experience, with deliberate placement, a consistent type hierarchy and a calm route from curiosity to accomplishment.',660,14,22)
box(W-M-220,H-276,220,137,fill=SOFT)
label(W-M-200,H-165,'DESIGN INTENT')
para(W-M-200,H-184,'Make the next step obvious.<br/>Make mistakes safe.<br/>Make progress visible.',180,12,22,INK)
thumbw=(W-2*M-36)/3
for i,(name,cap,bm) in enumerate([('welcome','01 / BECOME A DETECTIVE','welcome'),('casebook','02 / CHOOSE A MYSTERY','casebook'),('clues','03 / FOLLOW THE CLUES','clues')]):
    x=M+i*(thumbw+18)
    image(name+'-desktop',x,H-370,thumbw,265)
    label(x,H-655,cap)
    c.linkRect('',bm,(x,H-640,x+thumbw,H-370),relative=0,thickness=0)
line(M,137,W-M,137)
for i,(a,b) in enumerate([('09 screen specimens','Core pages, guidance and feedback states'),('04 mobile adaptations','Welcome, casebook and both activity types'),('01 clickable prototype','Real sample tasks and reversible interactions')]):
    x=M+i*(thumbw+18);text(x,108,a,13,'UI-Semibold');para(x,94,b,thumbw,10)
finish()

# 02. Journey and content architecture, with working PDF navigation.
begin('From a curious learner to a confident detective.','02 / EXPERIENCE MAP','The main route stays short. Support, settings and replay sit beside the task rather than interrupting it.',bookmark='journey')
steps=[('01','Welcome','Name + partner','welcome'),('02','Casebook','Unit + current case','casebook'),('03','Investigate','Clues or data tools','clues'),('04','Check','Review the evidence','retry'),('05','Celebrate','XP + next case','success')]
gap=19;bw=(W-2*M-gap*4)/5;y=H-300
for i,(num,title,body,bm) in enumerate(steps):
    x=M+i*(bw+gap);box(x,y,bw,115,fill=SOFT if i==2 else '#ffffff',r=4)
    label(x+17,y+91,num);text(x+17,y+59,title,20,'UI-Semibold');text(x+17,y+33,body,11,color=MUTED)
    c.linkRect('',bm,(x,y,x+bw,y+115),relative=0,thickness=0)
    if i<4:text(x+bw+5,y+55,'>',15,'Mono',MUTED)
label(M,H-345,'SUPPORTING PATHS')
for i,(title,body) in enumerate([('New to moving clues?','Open the first-use guide, then return to the activity.'),('Need another way to think?','Open a step-by-step hint. Placements stay intact.'),('Not quite there yet?','Review marked groups, adjust and check again.')]):
    x=M+i*((W-2*M-48)/3+24);y=H-383
    text(x,y,title,14,'UI-Semibold');para(x,y-15,body,325,11)
line(M,H-465,W-M,H-465)
label(M,H-502,'LEARNING ARCHITECTURE / 27 CASES')
units=[('01','Numbers & operations','10 cases','Sharing, operations, place value, fractions and money.'),('02','Algebra & reasoning','5 cases','Two-step problems, missing numbers, estimation and reasoning.'),('03','Measurement & geometry','4 cases','Length, time, shapes and mass.'),('04','Data analysis','8 cases','Pictographs, bar and line charts, pie charts and dashboards.')]
for i,(num,title,count,body) in enumerate(units):
    x=M+i*((W-2*M-54)/4+18);w=(W-2*M-54)/4
    label(x,H-542,num+' / '+count.upper());para(x,H-557,title,w,14,20,INK,'UI-Semibold');para(x,H-605,body,w,10.5)
para(M,104,'All units are open from the start. Cases unlock in order within a unit. Profile and completed-case progress are saved on the learner\'s device in the production website.',W-2*M,10)
finish()

# 03-11. Nine annotated desktop screen specimens.
subtitles={
'welcome':'Introduce the story and let the learner begin without account creation.',
'casebook':'Show the available learning tracks and give the next case a clear visual priority.',
'clues':'Place the mission, movable clues, destinations and checking actions in reading order.',
'demo':'Offer two equivalent input methods before the learner starts moving real clues.',
'hint':'Support a method, one prompt at a time, without revealing the complete answer.',
'retry':'Make the next attempt possible without clearing the learner\'s work.',
'success':'Connect the completed arrangement to progress and a clear next step.',
'data':'Make grouping, filtering, sorting and chart reading part of the investigation.',
'profile':'Reuse the familiar setup form to make editing predictable.'}
flows={'welcome':'Start investigation > Casebook','casebook':'Open case > Movement guide > Activity','clues':'Hint / Check > Retry or success','demo':'Let me try > Same activity','hint':'Let me try > Same activity','retry':'Move a clue > Check again','success':'Next case > Next investigation','data':'Set tools > Select evidence > Check','profile':'Save profile > Casebook'}
for s in notes:
    ident=s['id'];begin(s['title'],f'{page_no+1:02d} / DESKTOP SPECIMEN',subtitles[ident],bookmark=ident)
    x=M;y=H-163;maxw=822;maxh=H-244
    label(x,y,'DESKTOP / 1120 PX  ·  GRAYSCALE')
    image(ident+'-desktop',x,y-17,maxw,maxh)
    nx=914;ny=y-4
    for i,(title,body) in enumerate(s['notes']):ny=note(nx,ny,i+1,title,body,width=W-M-nx)
    line(nx,ny+3,W-M,ny+3);label(nx,ny-19,'FLOW CONNECTION')
    para(nx,ny-33,flows[ident],W-M-nx,10.5,color=INK)
    if ident=='profile':
        para(nx,ny-96,'This form is shown as a full-page specimen for review. The production website presents it inside a dialog.',W-M-nx,10)
    finish()

# 12-13. Mobile pairs, full-page images with annotations between specimens.
for title,ids,points in [
 ('A smaller screen. The same clear priorities.',['welcome','casebook'],[
  ('A stacked introduction','Story, illustration and setup form follow a single reading column. The name input stays above partner and colour choices.'),
  ('Units in a two-column grid','The progress summary drops beneath the greeting. The current case keeps a full-width primary action.'),
  ('Content determines the height','These are complete mobile pages at 390 px, including content below the first viewport. Natural scrolling preserves readable text.')]),
 ('Keep the evidence within reach.',['clues','data'],[
  ('Tap targets for young learners','Clues enlarge and evidence groups stack vertically. A compact destination dock supports moving a clue without a long drag.'),
  ('Tools reflow before the chart','The four data controls form two rows. Horizontal bars retain category labels, a readable scale and a clear answer state.'),
  ('Preserve the decision order','Mission, evidence, manipulation and Check remain in sequence. The primary action and optional hint have distinct placements.')])]:
    begin(title,f'{page_no+1:02d} / MOBILE ADAPTATIONS','390 px reference width. Full-page views show the complete content hierarchy and natural scrolling.',bookmark='mobile-'+ids[0])
    top=H-167;maxh=H-243
    for i,ident in enumerate(ids):
        x=70 if i==0 else 862
        label(x,top,('01 / ' if i==0 else '02 / ')+ident.upper())
        image(ident+'-mobile',x,top-17,258,maxh)
    ny=H-212
    for i,(a,b) in enumerate(points):ny=note(411,ny,i+1,a,b,300)-10
    line(411,ny+1,711,ny+1)
    label(411,ny-21,'RESPONSIVE RULE')
    para(411,ny-37,'Below 650 px, replace parallel desktop columns with vertical reading order. Keep content and actions inside the viewport rather than shrinking the entire desktop page.',300,11)
    finish()

# 14. Foundations and limits. Concrete typography and interaction specifications.
begin('A consistent language for every screen.','14 / DESIGN FOUNDATIONS','Neutral presentation keeps the proposal focused on structure, hierarchy and interaction.',bookmark='foundations')
col=(W-2*M-72)/3;xs=[M,M+col+36,M+2*(col+36)]
label(xs[0],H-175,'01 / TYPOGRAPHY')
text(xs[0],H-220,'Clear at a glance.',27,'UI-Semibold')
para(xs[0],H-243,'Use one neutral sans-serif family. The prototype uses Segoe UI with Arial fallback; final website headings use Short Stack and body text uses Onest.',col,11)
yy=H-341
for a,b in [('45 / 35 px','Welcome heading: desktop / mobile'),('31 / 27 px','Page title: desktop / mobile'),('27 / 25 px','Case title: desktop / mobile'),('13-15 px','Body and mission copy'),('9-12 px','Metadata and secondary labels')]:
    text(xs[0],yy,a,13,'UI-Semibold');para(xs[0]+88,yy+2,b,col-88,10.5);yy-=44
label(xs[1],H-175,'02 / SPACING & SURFACES')
para(xs[1],H-201,'A restrained grayscale palette and repeatable spacing make priorities visible without final illustrations or brand colour.',col,11)
for i,(color,lab) in enumerate([('#252525','Text / primary action'),('#65655e','Secondary information'),('#cecec5','Rules / component boundaries'),('#f2f2ed','Quiet grouped surfaces'),('#ffffff','Form and workspace surface')]):
    yy=H-310-i*43;box(xs[1],yy-11,26,26,fill=color,stroke=color,r=3);text(xs[1]+39,yy,lab,10.5)
para(xs[1],H-547,'Spacing rhythm: 8 / 12 / 16 / 24 / 32 px.<br/>Desktop page inset: 42 px.<br/>Mobile page inset: 20 px.<br/>Corner radius: 4-9 px.<br/>One dark primary action per task group.',col,11,20)
label(xs[2],H-175,'03 / INTERACTION & SCOPE')
yy=H-201
for a,b in [('Reversible by default','Clue selection, drag-and-drop, Undo and Reset support exploration. Feedback clears after a change.'),('Multiple ways to participate','Native controls, keyboard focus, tap-to-place, Escape dismissal and a chart/table choice support varied input needs.'),('Representative, not exhaustive','Nine specimens cover the core flow. The prototype samples activities rather than reproducing all 27 production cases.'),('Preferences are illustrative','ID/EN translates the main sample flow. Some secondary sample labels remain in English. Sound and desk controls show states; artwork and coat colours remain grayscale.')]:
    text(xs[2],yy,a,12,'UI-Semibold');yy=para(xs[2],yy-13,b,col,10.5)-24
line(M,141,W-M,141)
para(M,119,'Review basis: the current website implementation, including its onboarding, casebook, clue board, dashboard tools, hint dialogs, XP progression and responsive behaviour. The profile specimen uses a page presentation for clarity; the live site uses a dialog. This appendix does not claim user testing or measured learning outcomes.',W-2*M,10,16)
finish()
c.save()
print(PDF)
