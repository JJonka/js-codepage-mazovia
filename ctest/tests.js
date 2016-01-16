describe('README', function() {
  var readme = function() {
    var unicode_cp10000_255 = cptable[10000].dec[255]; // ˇ
    assert.equal(unicode_cp10000_255, "ˇ");

    var cp10000_711 = cptable[10000].enc[String.fromCharCode(711)]; // 255
    assert.equal(cp10000_711, 255);

    var b1 = [0xbb,0xe3,0xd7,0xdc];
    var 汇总 = cptable.utils.decode(936, b1);
    var buf =  cptable.utils.encode(936,  汇总);
    assert.equal(汇总,"汇总");
    assert.equal(buf.length, 4);
    for(var i = 0; i != 4; ++i) assert.equal(b1[i], buf[i]);
// dafuq

    var b2 = [0xf0,0x9f,0x8d,0xa3];
    var sushi= cptable.utils.decode(65001, b2);
    var sbuf = cptable.utils.encode(65001, sushi);
    assert.equal(sushi,"🍣");
    assert.equal(sbuf.length, 4);
    for(var i = 0; i != 4; ++i) assert.equal(b2[i], sbuf[i]);

  };
  it('should be correct', function() {
    cptable.utils.cache.encache();
    readme();
    cptable.utils.cache.decache();
    readme();
  });
});
describe('consistency', function() {
  U = cptable.utils;
  var chk = function(cptable, cacheit) { return function(x) {
    it('should consistently process CP ' + x + ' ' + cacheit, function() {
      var cp = cptable[x], D = cp.dec, E = cp.enc;
      if(cacheit) cptable.utils.cache.encache();
      else cptable.utils.cache.decache();
      Object.keys(D).forEach(function(d) {
        if(E[D[d]] != d) {
          if(typeof E[D[d]] !== "undefined") return;
          if(D[d].charCodeAt(0) == 0xFFFD) return;
          if(D[E[D[d]]] === D[d]) return;
          throw new Error(x + " e.d[" + d + "] = " + E[D[d]] + "; d[" + d + "]=" + D[d] + "; d.e.d[" + d + "] = " + D[E[D[d]]]);
        }
      });
      Object.keys(E).forEach(function(e) {
        if(D[E[e]] != e) {
          throw new Error(x + " d.e[" + e + "] = " + D[E[e]] + "; e[" + e + "]=" + E[e] + "; e.d.e[" + e + "] = " + E[D[E[e]]]);
        }
      });
      var corpus = ["foobar"];
      corpus.forEach(function(w){
        assert.equal(U.decode(x,U.encode(x,w)),w);
      });
      cptable.utils.cache.encache();
    });
  }; };
  Object.keys(cptable).filter(function(w) { return w == +w; }).forEach(chk(cptable, true));
  Object.keys(cptable).filter(function(w) { return w == +w; }).forEach(chk(cptable, false));
});
describe('entry conditions', function() {
  var chken = function(cp, i) {
    var c = function(cp, i, e) {
      var str = cptable.utils.encode(cp,i,e);
      var arr = cptable.utils.encode(cp,i.split(""),e);
      assert.deepEqual(str,arr);
      if(typeof Buffer === 'undefined') return;
      var buf = cptable.utils.encode(cp,new Buffer(i),e);
      assert.deepEqual(str,buf);
    };
    cptable.utils.cache.encache();
    c(cp,i);
    c(cp,i,'buf');
    c(cp,i,'arr');
    c(cp,i,'str');
    cptable.utils.cache.decache();
    c(cp,i);
    c(cp,i,'buf');
    c(cp,i,'arr');
    c(cp,i,'str');
  };
  describe('encode', function() {
    it('CP  1252 : sbcs', function() { chken(1252,"foobar"); });
    it('CP   708 : sbcs', function() { chken(708,"ت and ث smiley faces");});
    it('CP   936 : dbcs', function() { chken(936, "这是中文字符测试");});
  });
  var chkde = function(cp, i) {
    var c = function(cp, i) {
      var s;
      if(typeof Buffer !== 'undefined' && i instanceof Buffer) s = [].map.call(i, function(s){return String.fromCharCode(s); });
      else s=(i.map) ? i.map(function(s){return String.fromCharCode(s); }) : i;
      var str = cptable.utils.decode(cp,i);
      var arr = cptable.utils.decode(cp,s.join?s.join(""):s);
      assert.deepEqual(str,arr);
      if(typeof Buffer === 'undefined') return;
      var buf = cptable.utils.decode(cp,new Buffer(i));
      assert.deepEqual(str,buf);
    };
    cptable.utils.cache.encache();
    c(cp,i);
    cptable.utils.cache.decache();
    c(cp,i);
  };
  describe('decode', function() {
    it('CP  1252 : sbcs', function() { chkde(1252,[0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]); }); /* "foobar" */
    if(typeof Buffer !== 'undefined') it('CP   708 : sbcs', function() { chkde(708, new Buffer([0xca, 0x20, 0x61, 0x6e, 0x64, 0x20, 0xcb, 0x20, 0x73, 0x6d, 0x69, 0x6c, 0x65, 0x79, 0x20, 0x66, 0x61, 0x63, 0x65, 0x73])); }); /* ("ت and ث smiley faces") */
    it('CP   936 : dbcs', function() { chkde(936, [0xd5, 0xe2, 0xca, 0xc7, 0xd6, 0xd0, 0xce, 0xc4, 0xd7, 0xd6, 0xb7, 0xfb, 0xb2, 0xe2, 0xca, 0xd4]);}); /* "这是中文字符测试" */
  });
});
var m = cptable.utils.magic;
function cmp(x,z) {
  assert.equal(x.length, z.length);
  for(var i = 0; i != z.length; ++i) assert.equal(i+"/"+x.length+""+x[i], i+"/"+z.length+""+z[i]);
}
Object.keys(m).forEach(function(t){if(t != 16969) describe(m[t], function() {
  it("should process README.md." + m[t],
    function() {
      var b = README["str"];
      if(m[t] === "ascii") b = b.replace(/[\u0080-\uffff]*/g,"");
      var x = README[m[t]].data;
      cptable.utils.cache.encache();
      var y = cptable.utils.decode(t, x);
      assert.equal(y,b);
      cptable.utils.cache.decache();
      var y = cptable.utils.decode(t, x);
      assert.equal(y,b);
      cptable.utils.cache.encache();
    });
});});
describe('failures', function() {
  it('should fail to find CP 6969', function() {
    assert.throws(function(){cptable[6969].dec});
    assert.throws(function(){cptable[6969].enc});
  });
  it('should fail using utils', function() {
    assert(!cptable.utils.hascp(6969));
    assert.throws(function(){return cptable.utils.encode(6969, "foobar"); });
    assert.throws(function(){return cptable.utils.decode(6969, [0x20]); });
  });
  it('should fail with black magic', function() {
    assert(cptable.utils.hascp(16969));
    assert.throws(function(){return cptable.utils.encode(16969, "foobar"); });
    assert.throws(function(){return cptable.utils.decode(16969, [0x20]); });
  });
  it('should fail when presented with invalid char codes', function() {
    assert.throws(function(){cptable.utils.cache.decache(); return cptable.utils.encode(20127, [String.fromCharCode(0xAA)]);});
  });
});
