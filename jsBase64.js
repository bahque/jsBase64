/**
 a simple, non idiomatic implementation of base64, written to learn
 simple constructs and types, and because all the implementations I
 saw were not stand-alone, or did not liked me enough
*/

const textDecoder = new TextDecoder("utf-8"), textEncoder = new TextEncoder("utf-8");
const pcp = 64, pcv = 61; // padding character position and value
const sta = new Uint8Array(65), ats = new Uint8Array(256); // sextuplets <--> ascii codes
let urlSafe = false; // rfc4648#section-5 "-_", or standard "+/"
const plus = urlSafe ? 45 : 43, slash = urlSafe ? 95 : 47;

(function() { // setup alphabets
    for (let i = 65; i < 91; i++) { // A..Z
        sta[i - 65] = i;
        ats[i] = i - 65;
    }
    for (let i = 97; i < 123; i++) { // a..z
        sta[26 + i - 97] = i;
        ats[i] = 26 + i - 97;
    }
    for (let i = 48; i < 58; i++) { // 0..9
        sta[52 + i - 48] = i;
        ats[i] = 52 + i - 48;
    }
    sta[62] = plus; sta[63] = slash; // - _ =
    ats[plus] = 62; ats[slash] = 63;
    sta[pcp] = pcv;
})()

const bta = function(bs) { // Uint8Array binary to ascii
    if (bs.length === 0) return "";
    const ss = new Uint8Array(4 * Math.ceil(bs.length / 3)); // sextuplets
    const lenM3 = bs.length - 3;
    let i = 0, j = 0;
    for (; i <= lenM3; i += 3) {
        const b1 = bs[i], b2 = bs[i + 1], b3 = bs[i + 2];
        ss[j++] =                     b1 >> 2;
        ss[j++] = ((b1 &  3) << 4) + (b2 >> 4);
        ss[j++] = ((b2 & 15) << 2) + (b3 >> 6);
        ss[j++] =   b3 & 63;
    }
    if (i != bs.length) {
        let b1 = bs[i];
        ss[j++] = b1 >> 2;
        switch(bs.length - i) {
        case 1:
            ss[j++] = (b1 & 3) << 4;
            ss[j++] = pcp;
            break;
        case 2:
            const b2 = bs[i + 1];
            ss[j++] = ((b1 &  3) << 4) + (b2 >> 4);
            ss[j++] =  (b2 & 15) << 2;
            break;
        }
        ss[j++] = pcp;
    }
    for (let i = 0; i < j; i++) // convert sextuplets to ascii codes
        ss[i] = sta[ss[i]];
    return textDecoder.decode(ss); // then to string
}

const atb = function(s64) { // ascii to Uint8Array binary
    if (s64.length === 0) return new Uint8Array(0);
    const as = textEncoder.encode(s64); // ascii codes
    let len = as.length;
    while (pcv === as[--len]) // remove trailing '='
        ;
    const ss = new Uint8Array(len + 1); // sextuples
    for (let i = 0; i < ss.length; i++) {
        ss[i] = ats[as[i]];
        if (0 === ss[i] && 65 !== as[i] || pcv === as[i]) // check b64 syntax
            throw new Error("invalid character '" + as[i] + "' at pos " + i + " in " + s64);
    }
    const bs = new Uint8Array(3 * Math.floor(as.length / 4) - (as.length - ss.length)); // bytes - googled
    const lenM4 = ss.length - 4;
    let i = 0, j = 0;
    for (; i <= lenM4; i += 4) {
        const s2 = ss[i + 1], s3 = ss[i + 2];
        bs[j++] = (ss[i]     << 2) + (s2 >> 4);
        bs[j++] = ((s2 & 15) << 4) + (s3 >> 2);
        bs[j++] = ((s3 & 3)  << 6) + ss[i + 3];
    }
    if (i != ss.length) {
        switch (ss.length - i) {
        case 1:
            throw new Error("" + ss.length + " sextets in the input are not enough to specify the last byte");
            break;
        case 2:
            bs[j++] = (ss[i]     << 2) + (ss[i + 1] >> 4);
            break;
        case 3:
            const s2 = ss[i + 1];
            bs[j++] = (ss[i]     << 2) + (s2        >> 4);
            bs[j++] = ((s2 & 15) << 4) + (ss[i + 2] >> 2);
            break;
        }
    }
    return bs;
}


function test() {
    function equals(bs1, bs2) {
        if (bs1.length == bs2.length) {
            for (let i = 0; i < bs1.length; i++)
                if (bs1[i] !== bs2[i])
                    return false;
            return true;
        }
        return false;
    }
    
    for (let  j = 0; j < 100; j++)
        for (let i = 0; i < 100; i++) {
            bs = new Uint8Array(i);
            crypto.getRandomValues(bs);
            const s = bta(bs);
            console.log(s);
            const uus = atb(s);
            if (! equals(bs, uus))
                throw new Error("bug for input " + bs);
        }
}

//test();

// $Id: base64.js 286 2021-07-07 21:24:29Z abo $ EditCount 252
