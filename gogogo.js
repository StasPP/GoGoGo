const main = document.querySelector('.main');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
var sizeWidth = ctx.canvas.clientWidth;
var sizeHeight = ctx.canvas.clientHeight;
let mx, my;
let scale;
let inMenu = false;

let bigger = 2;

const sizes = [45,35,30,25,15]
const levelspeed = [2, 3, 4, 4, 5, 5, 6, 6, 7, 7]
const levelcount = [1, 1, 2, 2, 3, 3, 4, 4, 5, 7]
const levelsizes = [0, 0, 1, 2, 2, 3, 4, 4, 5, 5]
const levelkinds = [0, 0, 0, 1, 1, 1, 1, 1, 1, 1]  // 0 - olny Horizontal/Vertical, 1 - adds diagonal, 2 - adds circular
const levelups = [5, 15, 25, 45, 75, 115, 150, 190, 240, 300]  // 0 - olny Horizontal/Vertical, 1 - adds diagonal, 2 - adds circular

var current =[]; 
var particles =[];
var hints = []; 
let level, score, gotted, lives;
let win = undefined; 
var globalAnim = 0;
const menuPauseMax = 60
var menuPause = menuPauseMax;
var maxScore = 0;

const myColors = ["#FF0000", "#0000FF", "#DDD", "#0C0", "#999999", "#FA0"]
const myColorSets = [[0, 1, 2], [0, 5, 1], [3, 4, 2], [5, 0, 1], [3, 5, 0]]

class hint{
    constructor(x, y, dx, dy, kind)
    {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.ingame = true;
        this.kind= kind;
        this.anim = 0;


        if (this.kind === 0)
        {
            if (this.x < 0) this.x = 0;
            if (this.y < 0) this.y = 0;
            if (this.x > ctx.canvas.width) this.x = ctx.canvas.width;
            //if (this.y > ctx.canvas.height) this.y = ctx.canvas.height;
        }
    };
    
    hintfly(){
        if (!this.ingame) return
        this.x += this.dx*scale;
        this.y += this.dy*scale;

        this.dx *= 0.8;
        this.dy *= 0.8;

        this.anim++
   
 
        if (this.anim >= 100)
            this.ingame = false

    }

    hintdraw(){   
        if (!this.ingame) return
        const strs = ['-1 life', '', '', '', '']


        let str = this.kind > 5 ? '+'+(this.kind-5) :
                  this.kind == 1 ? 'LEVEL ' + (level+1) :
                  strs[this.kind]
        
        let cH = this.kind > 0 ? 20+40*scale*this.anim/100 : this.kind == 1 ? 40*scale : 20*scale;
        
        ctx.beginPath();
        
        ctx.font = Math.round(cH) +"px Arial black";
        let cW = ctx.measureText(str).width / 2;
        ctx.fillStyle =  this.kind > 5 ? 'rgba(90,205,0,'+(100-this.anim)/100+')' :
                         this.kind == 1 ? 'rgba(190,205,0,'+(100-this.anim)/100+')' :               
                        'rgba(205,0,0,'+(100-this.anim)/100+')' 
        
        if (this.kind === 0)
        {
            if (this.x < cW) this.x = cW;
            if (this.y < cH*2) this.y = cH*2;
            if (this.x > ctx.canvas.width-cW) this.x = ctx.canvas.width-cW;
            if (this.y > ctx.canvas.height+cH) this.y = ctx.canvas.height+cH;
        }
        ctx.fillText(str, this.x - cW, this.y - cH)
        ctx.fill(); ctx.closePath();  
        // console.log(this.kind)
    }

    
}


class particle{
    constructor(x, y, dx, dy, col, isStatic, force)
    {
        this.x = x;
        this.y = y;
        let F = 1 + Math.random()*(force+1);
        this.dx = dx*F;
        this.dy = dy*F;
        this.ingame = true;
        this.size = Math.random()*3 +1;
        this.color = col;
        this.t = 0;
        this.isStatic = isStatic;
      
    };
    
    particlesfly(){
        if (!this.ingame || this.isStatic) return
        this.x += this.dx*scale;
        this.y += (this.dy+this.t*0.5)*scale;
        this.t++;


        let sz = this.size*scale*1.5;
        if (this.x > ctx.canvas.width + sz|| 
            this.x < -sz ||
            this.y > ctx.canvas.height + sz) 
            // || this.y < -sz )
            
            this.ingame = false

    }

    particleShadows() {
        if (!this.ingame || this.isStatic) return
        ctx.beginPath();
        ctx.arc(this.x + 5*scale, this.y + 5*scale, this.size*scale*1.01, 0, Math.PI*2);
        ctx.fillStyle = "#9995DD77";
        ctx.fill(); ctx.closePath();     
    }

    partclesdraw(){   
        if (!this.ingame) return
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size*scale, 0, Math.PI*2);

        ctx.fillStyle = this.color;
        ctx.fill(); ctx.closePath();  
    }

        

}

function addhint (x, y, dx, dy, kind) {
    let newhint = new hint(x, y, dx, dy, kind)
    hints.push(newhint)
   // console.log(hints.length)
}

function hole(x,y) {
    let newParticle = new particle(x, y, 0, 0, '#333', true);
    particles.push(newParticle)
}

function explode(x, y, radius, color){
    const randomcols = ['#AAA','#111','#000','#777','#999']
    
    let max = Math.ceil(3*radius*Math.random()+3)
    let a0 = Math.PI*Math.random()
    let doRandomColor = (color == "#000000") 

    for (let i = 0; i < max; i++) { 
        l = radius*0.5 + 0.5*radius*Math.random(); 
        if (doRandomColor) color = randomcols[Math.floor(randomcols.length*Math.random())] 
        let newParticle = new particle(x + l*Math.sin(i*2*Math.PI/max + a0),
                                       y + l*Math.cos(i*2*Math.PI/max + a0), 
                                       Math.sin(i*2*Math.PI/max + a0),
                                       Math.cos(i*2*Math.PI/max + a0),
                                       color, false, doRandomColor ? 3:15);

        particles.push(newParticle)
    }
}

function miss(x, y){
    score -=1;
    /// 1. create a hole
    hole(x,y)
    /// 2. create particles
    explode(x, y, 5*scale, '#000000', false) 
    console.log(particles.length)
}

function checkLevel(){
    let oldlevel = level;
    for (let i = 0; i < levelups.length; i++) {
        if (gotted > levelups[i]) {
            level = i+1;
            if (i === levelups.length-1) {
                inMenu = true;
                menuPause = 0;
                win = true;
                if (maxScore < score)  maxScore = score;
            }
        }
    }

    if (oldlevel !== level) addhint(ctx.canvas.width/2, ctx.canvas.height/2, 0, -5, 1)

}

class target {
    constructor() { 
        this.kind = Math.trunc( (1+levelkinds[level]) * 4 * Math.random() ); // 0..3, 4..7, 8..11
        this.size = Math.trunc( (1+levelsizes[level]) * Math.random() );
        let sz = sizes[this.size]*scale;
        switch (this.kind) {
            case 0: this.y = -sz; 
                    this.x = sz + Math.random()*(ctx.canvas.width-sz*2);
                    break;

            case 1: this.y = ctx.canvas.height +sz; 
                    this.x = sz + Math.random()*(ctx.canvas.width-sz*2);
                    break;

            case 2: this.x = -sz; 
                    this.y = sz + Math.random()*(ctx.canvas.height-sz*2);
                    break;

            case 3: this.x = ctx.canvas.width +sz; 
                    this.y = sz + Math.random()*(ctx.canvas.height-sz*2);
                    break;

            case 4: this.y = -sz; 
                    this.x = -sz;
                    break;

            case 5: this.y = ctx.canvas.height +sz; 
                    this.x = -sz;
                    break;

            case 6: this.x = ctx.canvas.width +sz; 
                    this.y = -sz;
                    break;

            case 7: this.x = ctx.canvas.width +sz; 
                    this.y = sz + ctx.canvas.height;
                    break;

            default:     
                this.x = sz + Math.random()*(ctx.canvas.width-sz*2);
                this.y = sz + Math.random()*(ctx.canvas.height-sz*2);
        }
        this.ingame = true;
        this.hitted = false;
        let col = Math.trunc(Math.random()*myColorSets.length)
        this.col1 = myColors[myColorSets[col][0]]
        this.col2 = myColors[myColorSets[col][1]]
        this.col3 = myColors[myColorSets[col][2]]
        this.spd = Math.random()
    }

    targetFly() {  
            if (!this.ingame) return 0;
            let dx, dy;
            switch (this.kind) {
                case 0: dy = (this.spd + levelspeed[level])*scale; dx = 0; break; 
                case 1: dy =-(this.spd + levelspeed[level])*scale; dx = 0; break;  
                case 2: dx = (this.spd + levelspeed[level])*scale; dy = 0; break; 
                case 3: dx =-(this.spd + levelspeed[level])*scale; dy = 0; break;  
              
                case 4: dx = (this.spd + levelspeed[level])*scale*0.7;
                        dy = (this.spd + levelspeed[level])*scale*0.7; 
                        break; 
                case 5: dx = (this.spd + levelspeed[level])*scale*0.7;
                        dy =-(this.spd + levelspeed[level])*scale*0.7; 
                        break;  
                case 6: dx =-(this.spd + levelspeed[level])*scale*0.7; 
                        dy = (this.spd + levelspeed[level])*scale*0.7;
                        break; 
                case 7: dx =-(this.spd + levelspeed[level])*scale*0.7; 
                        dy =-(this.spd + levelspeed[level])*scale*0.7;
                        break;  
            }
            this.x += dx; 
            this.y += dy;
 
            let sz = sizes[this.size]*scale*1.05;
            if (this.x > ctx.canvas.width + sz|| 
                this.x < -sz ||
                this.y > ctx.canvas.height + sz || 
                this.y < -sz )
                {this.ingame = false; 
                    lives -=1; 
                    addhint(this.x, this.y, -dx, -dy, 0)
                    // console.log(this.x, this.y, -dx, -dy, 0);
                }

    }

    isHit(mx, my) {
        if (!this.ingame) return false;
        let sz = sizes[this.size]*scale; 
        if (Math.sqrt((this.x - mx)**2 + (this.y - my)**2) < sz || inMenu) 
        {
            this.ingame = false;
            this.hitted = true;
            gotted++;
            score += level+1;
            checkLevel();
            explode(this.x, this.y,  sz*0.9,  this.col1, false);
            explode(this.x, this.y,  sz*0.6,  this.col2, false);
            explode(this.x, this.y,  sz*0.2,  this.col3, false);
            addhint(this.x, this.y, 0, -5, 5+level+1);
            return true;
        }  else return false;  
    }

    targetShadows() {
        if (!this.ingame) return false;
        ctx.beginPath();
        ctx.arc(this.x + 5*scale, this.y + 5*scale, sizes[this.size]*scale*1.01, 0, Math.PI*2);
        ctx.fillStyle = "#9995DD77";
        ctx.fill(); ctx.closePath();
            
    }

    targetDraw() {
        if (!this.ingame) return false;
        ctx.beginPath();
        ctx.arc(this.x, this.y, sizes[this.size]*scale, 0, Math.PI*2);
        ctx.fillStyle = this.col1;
        ctx.fill(); ctx.closePath();
       
        ctx.beginPath();
        ctx.arc(this.x, this.y, sizes[this.size]*scale*0.7, 0, Math.PI*2);
        ctx.fillStyle = this.col2;
        ctx.fill(); ctx.closePath();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, sizes[this.size]*scale*0.4, 0, Math.PI*2);
        ctx.fillStyle = this.col3;
        ctx.fill(); ctx.closePath();
        
        if (inMenu) this.isHit(0, 0); 
    }


}

function generate() {
    for (let i = 0; i < levelcount[level]; i++) {
        let newTarget = new target;
        current.push(newTarget)
    }
}

function init() {
    ctx.canvas.width = ctx.canvas.clientWidth;
    ctx.canvas.height = ctx.canvas.clientHeight;
    scale = window.innerWidth < window.innerHeight ? window.innerWidth/640 : window.innerHeight/480;
    console.log('reinited ' +ctx.canvas.clientWidth+ ' '+ ctx.canvas.clientHeight)
} 

function newGame(){
    current = [];
    particles = [];
    hints = [];
    level = 0; 
    score = 0; 
    gotted = 0;
    lives = 5;
    checkLevel();
    if (win == undefined) {
        let cX = ctx.canvas.width / 2;
        let cY = ctx.canvas.height *0.4;
        explode(cX, cY,  sizes[0] *bigger *0.9,  myColors[0], false);
        explode(cX, cY,  sizes[0] *bigger *0.6,  myColors[1], false);
        explode(cX, cY,  sizes[0] *bigger *0.2,  myColors[2], false);
    }
    addhint(ctx.canvas.width/2, ctx.canvas.height/2, 0, -5, 1)
}

function shot() {
    if (inMenu) { 
        if (menuPause < menuPauseMax)
            return;
        inMenu = false; newGame(); 
        return
    }

    let hit = false
    current.forEach( (obj) => { if (obj.isHit(mx, my)) hit = true;});
   
    if (!hit) miss(mx, my)
   
}

function drawMisses(){
    particles.forEach( (a) => { a.particleShadows()})
        
    for (let i = particles.length-1; i >= 0; i--) {
        particles[i].particlesfly();  
        particles[i].partclesdraw(); 
        if (!particles[i].ingame) particles.splice(i, 1);
    }
}

function drawHints(){
 
    
    for (let i = hints.length-1; i >= 0; i--) {
        hints[i].hintfly();  
        hints[i].hintdraw();
        if (!hints[i].ingame) hints.splice(i, 1);
    }
}

function drawTargets() {
     
    current.forEach( (a) => { a.targetShadows()})
    for (let i = current.length-1; i >= 0; i--) {
        current[i].targetFly()  
        current[i].targetDraw()  
        if (!current[i].ingame){
            if (current.hitted) lives--
            current.splice(i, 1);
        }
    }

}

function drawCursor() {
    
    ctx.fillStyle = "#000000";
    
    ctx.beginPath();
    ctx.arc(mx, my, 10*scale, 0, Math.PI*2);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(mx - 12*scale, my);
    ctx.lineTo(mx + 12*scale, my);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(mx ,my - 12*scale);
    ctx.lineTo(mx, my + 12*scale);
    ctx.stroke();
    ctx.closePath(); 
 
}

function checkStatus() {
    
    
    if (score < 0) score = 0;
    document.getElementById('lives').innerText = 'Lives: '
    document.getElementById('score').innerText = 'Score: ' 
    document.getElementById('level').innerText = 'Level: ' 
    
    document.getElementById('lives').innerText += lives >= 0 ? lives : '0'
    document.getElementById('score').innerText += score 
    document.getElementById('level').innerText += level+1 

    if (lives < 0)
    { inMenu = true; win = false; if (maxScore < score) maxScore = score; menuPause = 0}

    if (inMenu) {
        document.getElementById('lives').innerText = 'Game'
        document.getElementById('level').innerText = 'by'  
        document.getElementById('score').innerText = 'Stanislav Shevchuk' 
    }
}

function drawMenu() {

    let cX = ctx.canvas.width *0.5;
    let cY = ctx.canvas.height *0.4;
    let str = '';
    let cH = 0;
    let cW = 0;
    let shadow = 0;

    if (menuPause < menuPauseMax) menuPause++
    if (globalAnim < 200) globalAnim++
            else globalAnim = 0;
    
    if (win == undefined)
    {
        ctx.beginPath();
        ctx.arc(cX + 5*scale, cY + 5*scale, sizes[0]*scale*bigger*1.01, 0, Math.PI*2);
        ctx.fillStyle = "#9995DD77";
        ctx.fill(); ctx.closePath();

        ctx.beginPath();
        ctx.arc(cX, cY, sizes[0]*scale*bigger, 0, Math.PI*2);
        ctx.fillStyle = myColors[0];
        ctx.fill(); ctx.closePath();
        
        ctx.beginPath();
        ctx.arc(cX, cY,  sizes[0]*scale*bigger*0.7, 0, Math.PI*2);
        ctx.fillStyle = myColors[1];
        ctx.fill(); ctx.closePath();
        
        ctx.beginPath();
        ctx.arc(cX, cY, sizes[0]*scale*bigger*0.4, 0, Math.PI*2);
        ctx.fillStyle = myColors[2];
        ctx.fill(); ctx.closePath();
        
        str = 'GoGoGo!'

        shadow = 5+3*Math.cos(globalAnim/100*Math.PI);

        cH = 50*scale+10*Math.cos(globalAnim/100*Math.PI);
        ctx.beginPath();
        ctx.font = Math.round(cH) +"px Arial black";
        cW = ctx.measureText(str).width / 2;
        
        ctx.fillStyle = "#5955ADAA";
        ctx.fillText(str, cX - cW+ shadow*scale, cY +cH/4  + shadow*scale)
        ctx.fillStyle = "#FFFF00";
        // ctx.fillStyle =  'rgba('+Math.ceil(155+100*Math.sin(globalAnim/25*Math.PI))+','
        //                     +Math.ceil(155+100*Math.cos(globalAnim/50*Math.PI))+','
        //                     +Math.ceil(155+100*Math.cos(globalAnim/12*Math.PI))+',255)';
        ctx.fillText(str, cX - cW, cY +cH/4 )
        ctx.fill(); ctx.closePath(); 


    }
    else 
    { 
        
        str = win? 'YOU WIN!!!' : 'Game over!'
        cY *= 0.6;

        cH = 50*scale;
        ctx.beginPath();
        ctx.font = Math.round(cH) +"px Arial black";
        cW = ctx.measureText(str).width / 2;
        ctx.fillStyle = "#5955ADAA";
        ctx.fillText(str, cX - cW+ 5*scale, cY +cH/4  + 5*scale)
        ctx.fillStyle =  win? "#0055FF" : "#F11";
        ctx.fillText(str, cX - cW, cY +cH/4 )
        ctx.fill(); ctx.closePath(); 

        str = 'Your best score is: '+ maxScore;
        cY *= 1.8;
        cH = 40*scale;
        ctx.beginPath();
        ctx.font = Math.round(cH) +"px Arial";
        cW = ctx.measureText(str).width / 2;
        ctx.fillStyle = "#5955ADAA";
        ctx.fillText(str, cX - cW+ 2*scale, cY +cH/4  + 2*scale)
        ctx.fillStyle = "#05F";
        ctx.fillText(str, cX - cW, cY +cH/4 )
        ctx.fill(); ctx.closePath(); 


    }
    
    if (Math.cos(globalAnim/25*Math.PI) > 0 && menuPause >= menuPauseMax){
        shadow = 2; //+Math.cos(globalAnim/25*Math.PI);
        str = 'Tap to start a new game!';
        cY = ctx.canvas.height*0.85;
        ctx.beginPath();
        cH = 30*scale;
        ctx.font = Math.round(cH) +"px Arial black";
        cW = ctx.measureText(str).width / 2;
        
        ctx.fillStyle = "#59557DAA";
        ctx.fillText(str, cX - cW+ shadow*scale, cY  + shadow*scale)
        ctx.fillStyle = "#F11";
        ctx.fillText(str, cX - cW, cY )
        ctx.fill();ctx.closePath();     
    }
    

}

function draw(){
    
    ctx.fillStyle = "#000000";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawMisses();
    drawTargets();
    drawHints();

    if (inMenu) drawMenu(); 
    else {
        checkStatus();
        if (current.length <= 0) 
            generate();
    }

    drawCursor();
    requestAnimationFrame(draw);
}

/// -------------------- EVENTS --------------------------------

canvas.addEventListener("mousemove", function(e) { 
    let cRect = canvas.getBoundingClientRect();        // Gets CSS pos, and width/height
    mx = Math.round(e.clientX - cRect.left);  // Subtract the 'left' of the canvas 
    my = Math.round(e.clientY - cRect.top);   // from the X/Y positions to make  
});

canvas.addEventListener("mouseout", function(e) { 
    mx = -100;
    my = -100;
});

canvas.addEventListener('mouseup', shot)

addEventListener('resize', init)

// newGame();
init();
draw();


inMenu = true;
checkStatus();