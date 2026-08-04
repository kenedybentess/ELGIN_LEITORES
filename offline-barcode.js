// OFFLINE BARCODE LIB - 100% offline
(function(){
  const CODE128={"0":"11011001100","1":"11001101100","2":"11001100110","3":"10010011000","4":"10010001100","5":"10001001100","6":"10011001000","7":"10011000100","8":"10001100100","9":"11001001000","10":"11001000100","11":"11000100100","12":"10110011100","13":"10011011100","14":"10011001110","15":"10111001100","16":"10011101100","17":"10011100110","18":"11001110010","19":"11001011100","20":"11001001110","21":"11011100100","22":"11001110100","23":"11101101110","24":"11101001100","25":"11100101100","26":"11100100110","27":"11101100100","28":"11100110100","29":"11100110010","30":"11011011000","31":"11011000110","32":"11000110110","33":"10100011000","34":"10001011000","35":"10001000110","36":"10110001000","37":"10001101000","38":"10001100010","39":"11010001000","40":"11000101000","41":"11000100010","42":"10110111000","43":"10110001110","44":"10001101110","45":"10111011000","46":"10111000110","47":"10001110110","48":"11101110110","49":"11010001110","50":"11000101110","51":"11011101000","52":"11011100010","53":"11011101110","54":"11101011000","55":"11101000110","56":"11100010110","57":"11101101000","58":"11101100010","59":"11100011010","60":"11101111010","61":"11001000010","62":"11110001010","63":"10100110000","64":"10100001100","65":"10010110000","66":"10010000110","67":"10000101100","68":"10000100110","69":"10110010000","70":"10110000100","71":"10011010000","72":"10011000010","73":"10000110100","74":"10000110010","75":"11000010010","76":"11001010000","77":"11110111010","78":"11000010100","79":"10001111010","80":"10100111100","81":"10010111100","82":"10010011110","83":"10111100100","84":"10011110100","85":"10011110010","86":"11110100100","87":"11110010100","88":"11110010010","89":"11011011110","90":"11011110110","91":"11110110110","92":"10101111000","93":"10100011110","94":"10001011110","95":"10111101000","96":"10111100010","97":"11110101000","98":"11110100010","99":"10111011110","100":"10111101110","101":"11101011110","102":"11110101110","103":"11010000100","104":"11010010000","105":"11010011100","106":"1100011101011"};
  const L=["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
  const G=["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"];
  const R=["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
  const STRUCT=["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];
  function code128Encode(text){
    let codes=[104];
    for(let i=0;i<text.length;i++){let c=text.charCodeAt(i); if(c>=32&&c<=126) codes.push(c-32);}
    let checksum=codes[0]; for(let i=1;i<codes.length;i++) checksum+=codes[i]*i; checksum%=103; codes.push(checksum); codes.push(106);
    let bin=""; codes.forEach(c=>bin+=CODE128[c]); return bin;
  }
  function ean13Encode(num){
    let s=(num+"").replace(/[^0-9]/g,"").padStart(12,"0").slice(0,12);
    let check=0; for(let i=0;i<12;i++){let d=parseInt(s[i]); check+=(i%2===0)?d:d*3;} check=(10-(check%10))%10; s=s+check;
    let first=parseInt(s[0]); let pattern=STRUCT[first]; let bin="101";
    for(let i=1;i<=6;i++){let d=parseInt(s[i]); bin+=(pattern[i-1]==="L"?L[d]:G[d]);}
    bin+="01010"; for(let i=7;i<=12;i++){let d=parseInt(s[i]); bin+=R[d];} bin+="101"; return {binary:bin,text:s};
  }
  function drawBinaryToSVG(svg,binary,opts){
    opts=opts||{}; let width=opts.width||1.6; let height=opts.height||50; let margin=opts.margin||2;
    svg.innerHTML=""; svg.setAttribute("width",(binary.length*width+margin*2)); svg.setAttribute("height",height); svg.style.width="100%"; svg.style.height="100%";
    let x=margin;
    for(let i=0;i<binary.length;i++){if(binary[i]==="1"){let rect=document.createElementNS("http://www.w3.org/2000/svg","rect"); rect.setAttribute("x",x); rect.setAttribute("y",0); rect.setAttribute("width",width); rect.setAttribute("height",height); rect.setAttribute("fill",opts.lineColor||"#000"); svg.appendChild(rect);} x+=width;}
  }
  window.OfflineBarcode={code128:code128Encode,ean13:ean13Encode,draw:drawBinaryToSVG};
  window.JsBarcode=function(selector,value,opts){
    try{
      let svg=typeof selector==="string"?document.querySelector(selector):selector; if(!svg) return;
      opts=opts||{}; let format=(opts.format||"CODE128").toUpperCase(); let val=value||svg.getAttribute("jsbarcode-value")||"";
      if(!val) return;
      if(format==="EAN13"|| (val.length>=12&&/^[0-9]+$/.test(val) && (format.includes("EAN")||opts.ean))){
        let res=ean13Encode(val); drawBinaryToSVG(svg,res.binary,{width:opts.width||1.6,height:opts.height||50,lineColor:opts.lineColor||"#000",margin:opts.margin||2});
      } else {
        let bin=code128Encode(val); drawBinaryToSVG(svg,bin,{width:opts.width||1.6,height:opts.height||38,lineColor:opts.lineColor||"#000",margin:opts.margin||2});
      }
    }catch(e){console.log("JsBarcode offline error",e);}
  };
  window.JsBarcode.version="offline-1.0";
})();
