(function(){
    var root = this;

    //æ¶ˆæ¯å¡«å……ä½ï¼Œè¡¥è¶³é•¿åº¦ã€‚
    function fillString(str){
        var blockAmount = ((str.length + 8) >> 6) + 1,
            blocks = [],
            i;

        for(i = 0; i < blockAmount * 16; i++){
            blocks[i] = 0;
        }
        for(i = 0; i < str.length; i++){
            blocks[i >> 2] |= str.charCodeAt(i) << (24 - (i & 3) * 8);
        }
        blocks[i >> 2] |= 0x80 << (24 - (i & 3) * 8);
        blocks[blockAmount * 16 - 1] = str.length * 8;

        return blocks;
    }

    //å°†è¾“å…¥çš„äºŒè¿›åˆ¶æ•°ç»„è½¬åŒ–ä¸ºåå…­è¿›åˆ¶çš„å­—ç¬¦ä¸²ã€‚
    function binToHex(binArray){
        var hexString = "0123456789abcdef",
            str = "",
            i;

        for(i = 0; i < binArray.length * 4; i++){
            str += hexString.charAt((binArray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                    hexString.charAt((binArray[i >> 2] >> ((3 - i % 4) * 8  )) & 0xF);
        }

        return str;
    }

    //æ ¸å¿ƒå‡½æ•°ï¼Œè¾“å‡ºä¸ºé•¿åº¦ä¸º5çš„numberæ•°ç»„ï¼Œå¯¹åº”160ä½çš„æ¶ˆæ¯æ‘˜è¦ã€‚
    function coreFunction(blockArray){
        var w = [],
            a = 0x67452301,
            b = 0xEFCDAB89,
            c = 0x98BADCFE,
            d = 0x10325476,
            e = 0xC3D2E1F0,
            olda,
            oldb,
            oldc,
            oldd,
            olde,
            t,
            i,
            j;

        for(i = 0; i < blockArray.length; i += 16){  //æ¯æ¬¡å¤„ç†512ä½ 16*32
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;
            olde = e;

            for(j = 0; j < 80; j++){  //å¯¹æ¯ä¸ª512ä½è¿›è¡Œ80æ­¥æ“ä½œ
                if(j < 16){
                    w[j] = blockArray[i + j];
                }else{
                    w[j] = cyclicShift(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
                }
                t = modPlus(modPlus(cyclicShift(a, 5), ft(j, b, c, d)), modPlus(modPlus(e, w[j]), kt(j)));
                e = d;
                d = c;
                c = cyclicShift(b, 30);
                b = a;
                a = t;
            }

            a = modPlus(a, olda);
            b = modPlus(b, oldb);
            c = modPlus(c, oldc);
            d = modPlus(d, oldd);
            e = modPlus(e, olde);
        }

        return [a, b, c, d, e];
    }

    //æ ¹æ®tå€¼è¿”å›žç›¸åº”å¾—åŽ‹ç¼©å‡½æ•°ä¸­ç”¨åˆ°çš„få‡½æ•°ã€‚
    function ft(t, b, c, d){
        if(t < 20){
            return (b & c) | ((~b) & d);
        }else if(t < 40){
            return b ^ c ^ d;
        }else if(t < 60){
            return (b & c) | (b & d) | (c & d);
        }else{
            return b ^ c ^ d;
        }
    }

    //æ ¹æ®tå€¼è¿”å›žç›¸åº”å¾—åŽ‹ç¼©å‡½æ•°ä¸­ç”¨åˆ°çš„Kå€¼ã€‚
    function kt(t){
        return (t < 20) ?  0x5A827999 :
                (t < 40) ? 0x6ED9EBA1 :
                (t < 60) ? 0x8F1BBCDC : 0xCA62C1D6;
    }

    //æ¨¡2çš„32æ¬¡æ–¹åŠ æ³•ï¼Œå› ä¸ºJavaScriptçš„numberæ˜¯åŒç²¾åº¦æµ®ç‚¹æ•°è¡¨ç¤ºï¼Œæ‰€ä»¥å°†32ä½æ•°æ‹†æˆé«˜16ä½å’Œä½Ž16ä½åˆ†åˆ«è¿›è¡Œç›¸åŠ
    function modPlus(x, y){
        var low = (x & 0xFFFF) + (y & 0xFFFF),
            high = (x >> 16) + (y >> 16) + (low >> 16);

        return (high << 16) | (low & 0xFFFF);
    }

    //å¯¹è¾“å…¥çš„32ä½çš„numäºŒè¿›åˆ¶æ•°è¿›è¡Œå¾ªçŽ¯å·¦ç§» ,å› ä¸ºJavaScriptçš„numberæ˜¯åŒç²¾åº¦æµ®ç‚¹æ•°è¡¨ç¤ºï¼Œæ‰€ä»¥ç§»ä½éœ€éœ€è¦æ³¨æ„
    function cyclicShift(num, k){
        return (num << k) | (num >>> (32 - k));
    }

    //ä¸»å‡½æ•°æ ¹æ®è¾“å…¥çš„æ¶ˆæ¯å­—ç¬¦ä¸²è®¡ç®—æ¶ˆæ¯æ‘˜è¦ï¼Œè¿”å›žåå…­è¿›åˆ¶è¡¨ç¤ºçš„æ¶ˆæ¯æ‘˜è¦
    function sha1(s){
        return binToHex(coreFunction(fillString(s)));
    }

    // support AMD and Node
    if(typeof define === "function" && define.amd){
        define(function(){
            return sha1;
        });
    }else if(typeof exports !== 'undefined') {
        if(typeof module !== 'undefined' && module.exports) {
          exports = module.exports = sha1;
        }
        exports.sha1 = sha1;
    } else {
        root.sha1 = sha1;
    }

}).call(this);
