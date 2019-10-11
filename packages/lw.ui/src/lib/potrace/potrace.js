/* Copyright (C) 2001-2013 Peter Selinger.
 *
 * A javascript port of Potrace (http://potrace.sourceforge.net).
 * 
 * Licensed under the GPL
 * 
 * Usage
 *   loadImageFromFile(file) : load image from File API
 *   loadImageFromUrl(url): load image from URL
 *     because of the same-origin policy, can not load image from another domain.
 *     input color/grayscale image is simply converted to binary image. no pre-
 *     process is performed.
 * 
 *   setParameter({para1: value, ...}) : set parameters
 *     parameters:
 *        turnpolicy ("black" / "white" / "left" / "right" / "minority" / "majority")
 *          how to resolve ambiguities in path decomposition. (default: "minority")       
 *        turdsize
 *          suppress speckles of up to this size (default: 2)
 *        optcurve (true / false)
 *          turn on/off curve optimization (default: true)
 *        alphamax
 *          corner threshold parameter (default: 1)
 *        opttolerance 
 *          curve optimization tolerance (default: 0.2)
 *       
 *   process(callback) : wait for the image be loaded, then run potrace algorithm,
 *                       then call callback function.
 * 
 *   getSVG(size, opt_type) : return a string of generated SVG image.
 *                                    result_image_size = original_image_size * size
 *                                    optional parameter opt_type can be "curve"
 */



  function Point(x, y) {
    this.x = x;
    this.y = y;
  }
  
  Point.prototype.copy = function(){
    return new Point(this.x, this.y);
  };

  function Bitmap(w, h) {
    this.w = w;
    this.h = h;
    this.size = w * h;
    this.arraybuffer = new ArrayBuffer(this.size);
    this.data = new Int8Array(this.arraybuffer);
  }

  Bitmap.prototype.at = function (x, y) {
    return (x >= 0 && x < this.w && y >=0 && y < this.h) && 
        this.data[this.w * y + x] === 1;
  };

  Bitmap.prototype.index = function(i) {
    var point = new Point();
    point.y = Math.floor(i / this.w);
    point.x = i - point.y * this.w;
    return point;
  };

  Bitmap.prototype.flip = function(x, y) {
    if (this.at(x, y)) {
      this.data[this.w * y + x] = 0;
    } else {
      this.data[this.w * y + x] = 1;
    }
  };
    
  Bitmap.prototype.copy = function() {
    var bm = new Bitmap(this.w, this.h), i;
    for (i = 0; i < this.size; i++) {
      bm.data[i] = this.data[i];
    }
    return bm;
  };

  function Path() {
    this.area = 0;
    this.len = 0;
    this.curve = {};
    this.pt = [];
    this.minX = 100000;
    this.minY = 100000;
    this.maxX= -1;
    this.maxY = -1;
  }

  function Curve(n) {
    this.n = n;
    this.tag = new Array(n);
    this.c = new Array(n * 3);
    this.alphaCurve = 0;
    this.vertex = new Array(n);
    this.alpha = new Array(n);
    this.alpha0 = new Array(n);
    this.beta = new Array(n);
  }

  var imgElement = document.createElement("img"),
      imgCanvas = document.createElement("canvas"),
      bm = null,
      pathlist = [],
      callback,
      info = {
        isReady: false,
        turnpolicy: "minority", 
        turdsize: 2,
        optcurve: true,
        alphamax: 1,
        opttolerance: 0.2
      };

  imgElement.onload = function() {
    loadCanvas();
    loadBm();
  };

  function loadImageFromFile(file) {
    if (info.isReady) {
      clear();
    }
    imgElement.file = file;
    var reader = new FileReader();
    reader.onload = (function(aImg) {
      return function(e) {
        aImg.src = e.target.result;
      };
    })(imgElement);
    reader.readAsDataURL(file);
  }
  
  function loadImageFromUrl(url) {
    if (info.isReady) {
      clear();
    }
    imgElement.src = url;
    
  }
  
  function setParameter(obj) {
   var key;
   for (key in obj) {
     if (obj.hasOwnProperty(key)) {
       info[key] = obj[key];
     }
    }
  }
  
  function loadCanvas() {
    imgCanvas.width = imgElement.width;
    imgCanvas.height = imgElement.height;
    var ctx = imgCanvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
  }
  
  function loadBm() {
    var ctx = imgCanvas.getContext('2d');
    bm = new Bitmap(imgCanvas.width, imgCanvas.height);
    var imgdataobj = ctx.getImageData(0, 0, bm.w, bm.h);
    var l = imgdataobj.data.length, i, j, color;
    for (i = 0, j = 0; i < l; i += 4, j++) {
      color = 0.2126 * imgdataobj.data[i] + 0.7153 * imgdataobj.data[i + 1] +
          0.0721 * imgdataobj.data[i + 2];
      bm.data[j] = (color < 128 ? 1 : 0);
    }
    info.isReady = true;
  }
  
  
  function bmToPathlist() {
  
    var bm1 = bm.copy(),
      currentPoint = new Point(0, 0),
      path;
    
    function findNext(point) {
      var i = bm1.w * point.y + point.x;
      while (i < bm1.size && bm1.data[i] !== 1) {
        i++;
      }
      return i < bm1.size && bm1.index(i);
    }
    
    function majority(x, y) {
      var i, a, ct;
      for (i = 2; i < 5; i++) {
        ct = 0;
        for (a = -i + 1; a <= i - 1; a++) {
          ct += bm1.at(x + a, y + i - 1) ? 1 : -1;
          ct += bm1.at(x + i - 1, y + a - 1) ? 1 : -1;
          ct += bm1.at(x + a - 1, y - i) ? 1 : -1;
          ct += bm1.at(x - i, y + a) ? 1 : -1;
        }
        if (ct > 0) {
          return 1;
        } else if (ct < 0) {
          return 0;
        }
      }
      return 0;
    }
    
    function findPath(point) {
      var path = new Path(),
        x = point.x, y = point.y,
        dirx = 0, diry = 1, tmp;
      
      path.sign = bm.at(point.x, point.y) ? "+" : "-";
      
      while (1) {
        path.pt.push(new Point(x, y));
        if (x > path.maxX)
          path.maxX = x;
        if (x < path.minX)
          path.minX = x;
        if (y > path.maxY)
          path.maxY = y;
        if (y < path.minY)
          path.minY = y;
        path.len++;
        
        x += dirx;
        y += diry;
        path.area -= x * diry;
        
        if (x === point.x && y === point.y)
          break;
        
        var l = bm1.at(x + (dirx + diry - 1 ) / 2, y + (diry - dirx - 1) / 2);
        var r = bm1.at(x + (dirx - diry - 1) / 2, y + (diry + dirx - 1) / 2);
        
        if (r && !l) {
          if (info.turnpolicy === "right" ||
          (info.turnpolicy === "black" && path.sign === '+') ||
          (info.turnpolicy === "white" && path.sign === '-') ||
          (info.turnpolicy === "majority" && majority(x, y)) ||
          (info.turnpolicy === "minority" && !majority(x, y))) {
            tmp = dirx;
            dirx = -diry;
            diry = tmp;
          } else {
            tmp = dirx;
            dirx = diry;
            diry = -tmp;
          }
        } else if (r) {
          tmp = dirx;
          dirx = -diry;
          diry = tmp;
        } else if (!l) {
          tmp = dirx;
          dirx = diry;
          diry = -tmp;
        }
      }
      return path;
    }
    
    function xorPath(path){
      var y1 = path.pt[0].y,
        len = path.len,
        x, y, maxX, minY, i, j;
      for (i = 1; i < len; i++) {
        x = path.pt[i].x;
        y = path.pt[i].y;
        
        if (y !== y1) {
          minY = y1 < y ? y1 : y;
          maxX = path.maxX;
          for (j = x; j < maxX; j++) {
            bm1.flip(j, minY);
          }
          y1 = y;
        }
      }
      
    }
    
    while (currentPoint = findNext(currentPoint)) {

      path = findPath(currentPoint);
      
      xorPath(path);
      
      if (path.area > info.turdsize) {
        pathlist.push(path);
      }
    }
    
  }
  

  function processPath() {
  
    function Quad() {
      this.data = [0,0,0,0,0,0,0,0,0];
    }

    Quad.prototype.at = function(x, y) {
      return this.data[x * 3 + y];
    };
    
    function Sum(x, y, xy, x2, y2) {
      this.x = x;
      this.y = y;
      this.xy = xy;
      this.x2 = x2;
      this.y2 = y2;
    }
    
    function mod(a, n) {
        return a >= n ? a % n : a>=0 ? a : n-1-(-1-a) % n;
    }
  
    function xprod(p1, p2) {
      return p1.x * p2.y - p1.y * p2.x;
    }
    
    function cyclic(a, b, c) {
      if (a <= c) {
        return (a <= b && b < c);
      } else {
        return (a <= b || b < c);
      }
    }
      
    function sign(i) {
      return i > 0 ? 1 : i < 0 ? -1 : 0;
    }
    
    function quadform(Q, w) {
      var v = new Array(3), i, j, sum;
    
      v[0] = w.x;
      v[1] = w.y;
      v[2] = 1;
      sum = 0.0;
    
      for (i=0; i<3; i++) {
        for (j=0; j<3; j++) {
          sum += v[i] * Q.at(i, j) * v[j];
        }
      }
      return sum;
    }
  
    function interval(lambda, a, b) {
      var res = new Point();
    
      res.x = a.x + lambda * (b.x - a.x);
      res.y = a.y + lambda * (b.y - a.y);
      return res;
    }
    
    function dorth_infty(p0, p2) {
      var r = new Point();
      
      r.y = sign(p2.x - p0.x);
      r.x = -sign(p2.y - p0.y);
    
      return r;
    }
    
    function ddenom(p0, p2) {
      var r = dorth_infty(p0, p2);
    
      return r.y * (p2.x - p0.x) - r.x * (p2.y - p0.y);
    }
    
    function dpara(p0, p1, p2) {
      var x1, y1, x2, y2;
    
      x1 = p1.x - p0.x;
      y1 = p1.y - p0.y;
      x2 = p2.x - p0.x;
      y2 = p2.y - p0.y;
    
      return x1 * y2 - x2 * y1;
    }
    
    function cprod(p0, p1, p2, p3) {
      var x1, y1, x2, y2;
    
      x1 = p1.x - p0.x;
      y1 = p1.y - p0.y;
      x2 = p3.x - p2.x;
      y2 = p3.y - p2.y;
    
      return x1 * y2 - x2 * y1;
    }
      
    function iprod(p0, p1, p2) {
      var x1, y1, x2, y2;
    
      x1 = p1.x - p0.x;
      y1 = p1.y - p0.y;
      x2 = p2.x - p0.x;
      y2 = p2.y - p0.y;
    
      return x1*x2 + y1*y2;
    }
      
    function iprod1(p0, p1, p2, p3) {
      var x1, y1, x2, y2;
    
      x1 = p1.x - p0.x;
      y1 = p1.y - p0.y;
      x2 = p3.x - p2.x;
      y2 = p3.y - p2.y;
    
      return x1 * x2 + y1 * y2;
    }
    
    function ddist(p, q) {
      return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
    }
    
    function bezier(t, p0, p1, p2, p3) {
      var s = 1 - t, res = new Point();
    
      res.x = s*s*s*p0.x + 3*(s*s*t)*p1.x + 3*(t*t*s)*p2.x + t*t*t*p3.x;
      res.y = s*s*s*p0.y + 3*(s*s*t)*p1.y + 3*(t*t*s)*p2.y + t*t*t*p3.y;
    
      return res;
    }
  
    function tangent(p0, p1, p2, p3, q0, q1) {
      var A, B, C, a, b, c, d, s, r1, r2;
    
      A = cprod(p0, p1, q0, q1);
      B = cprod(p1, p2, q0, q1);
      C = cprod(p2, p3, q0, q1);
    
      a = A - 2 * B + C;
      b = -2 * A + 2 * B;
      c = A;
      
      d = b * b - 4 * a * c;
    
      if (a===0 || d<0) {
        return -1.0;
      }
    
      s = Math.sqrt(d);
    
      r1 = (-b + s) / (2 * a);
      r2 = (-b - s) / (2 * a);
    
      if (r1 >= 0 && r1 <= 1) {
        return r1;
      } else if (r2 >= 0 && r2 <= 1) {
        return r2;
      } else {
        return -1.0;
      }
    }
    
    function calcSums(path) {
      var i, x, y;
      path.x0 = path.pt[0].x;
      path.y0 = path.pt[0].y;
      
      path.sums = [];
      var s = path.sums;
      s.push(new Sum(0, 0, 0, 0, 0));
      for(i = 0; i < path.len; i++){
        x = path.pt[i].x - path.x0;
        y = path.pt[i].y - path.y0;
        s.push(new Sum(s[i].x + x, s[i].y + y, s[i].xy + x * y,
            s[i].x2 + x * x, s[i].y2 + y * y));
      }
    }
   
    function calcLon(path) {
      
      var n = path.len, pt = path.pt, dir,
        pivk = new Array(n),
        nc = new Array(n),
        ct = new Array(4);
      path.lon = new Array(n);
      
      var constraint = [new Point(), new Point()],
          cur = new Point(),
          off = new Point(),
          dk = new Point(),
          foundk;
      
      var i, j, k1, a, b, c, d, k = 0;
      for(i = n - 1; i >= 0; i--){
        if (pt[i].x != pt[k].x && pt[i].y != pt[k].y) {
          k = i + 1;
        }
        nc[i] = k;
      }
      
      for (i = n - 1; i >= 0; i--) {
        ct[0] = ct[1] = ct[2] = ct[3] = 0;
        dir = (3 + 3 * (pt[mod(i + 1, n)].x - pt[i].x) + 
            (pt[mod(i + 1, n)].y - pt[i].y)) / 2;
        ct[dir]++;
        
        constraint[0].x = 0;
        constraint[0].y = 0;
        constraint[1].x = 0;
        constraint[1].y = 0;
        
        k = nc[i];
        k1 = i;
        while (1) {
          foundk = 0;
          dir =  (3 + 3 * sign(pt[k].x - pt[k1].x) + 
              sign(pt[k].y - pt[k1].y)) / 2;
          ct[dir]++;
          
          if (ct[0] && ct[1] && ct[2] && ct[3]) {
            pivk[i] = k1;
            foundk = 1;
            break;
          }
          
          cur.x = pt[k].x - pt[i].x;
          cur.y = pt[k].y - pt[i].y;
          
          if (xprod(constraint[0], cur) < 0 || xprod(constraint[1], cur) > 0) {
            break;
          }
              
          if (Math.abs(cur.x) <= 1 && Math.abs(cur.y) <= 1) {
          
          } else {
            off.x = cur.x + ((cur.y >= 0 && (cur.y > 0 || cur.x < 0)) ? 1 : -1);
            off.y = cur.y + ((cur.x <= 0 && (cur.x < 0 || cur.y < 0)) ? 1 : -1);
            if (xprod(constraint[0], off) >= 0) {
              constraint[0].x = off.x;
              constraint[0].y = off.y;
            }
            off.x = cur.x + ((cur.y <= 0 && (cur.y < 0 || cur.x < 0)) ? 1 : -1);
            off.y = cur.y + ((cur.x >= 0 && (cur.x > 0 || cur.y < 0)) ? 1 : -1);
            if (xprod(constraint[1], off) <= 0) {
              constraint[1].x = off.x;
              constraint[1].y = off.y;
            }
          }
          k1 = k;
          k = nc[k1];
          if (!cyclic(k, i, k1)) {
            break;
          }
        }
        if (foundk === 0) {
          dk.x = sign(pt[k].x-pt[k1].x);
          dk.y = sign(pt[k].y-pt[k1].y);
          cur.x = pt[k1].x - pt[i].x;
          cur.y = pt[k1].y - pt[i].y;
  
          a = xprod(constraint[0], cur);
          b = xprod(constraint[0], dk);
          c = xprod(constraint[1], cur);
          d = xprod(constraint[1], dk);
  
          j = 10000000;
          if (b < 0) {
            j = Math.floor(a / -b);
          }
          if (d > 0) {
            j = Math.min(j, Math.floor(-c / d));
          }
          pivk[i] = mod(k1+j,n);
        }
      }
      
      j=pivk[n-1];
      path.lon[n-1]=j;
      for (i=n-2; i>=0; i--) {
        if (cyclic(i+1,pivk[i],j)) {
          j=pivk[i];
        }
        path.lon[i]=j;
      }
  
      for (i=n-1; cyclic(mod(i+1,n),j,path.lon[i]); i--) {
        path.lon[i] = j;
      }
    }
    
    function bestPolygon(path) {
      
      function penalty3(path, i, j) {
        
        var n = path.len, pt = path.pt, sums = path.sums;
        var x, y, xy, x2, y2,
          k, a, b, c, s,
          px, py, ex, ey,
          r = 0;
        if (j>=n) {
          j -= n;
          r = 1;
        }
        
        if (r === 0) {
          x = sums[j+1].x - sums[i].x;
          y = sums[j+1].y - sums[i].y;
          x2 = sums[j+1].x2 - sums[i].x2;
          xy = sums[j+1].xy - sums[i].xy;
          y2 = sums[j+1].y2 - sums[i].y2;
          k = j+1 - i;
        } else {
          x = sums[j+1].x - sums[i].x + sums[n].x;
          y = sums[j+1].y - sums[i].y + sums[n].y;
          x2 = sums[j+1].x2 - sums[i].x2 + sums[n].x2;
          xy = sums[j+1].xy - sums[i].xy + sums[n].xy;
          y2 = sums[j+1].y2 - sums[i].y2 + sums[n].y2;
          k = j+1 - i + n;
        } 
      
        px = (pt[i].x + pt[j].x) / 2.0 - pt[0].x;
        py = (pt[i].y + pt[j].y) / 2.0 - pt[0].y;
        ey = (pt[j].x - pt[i].x);
        ex = -(pt[j].y - pt[i].y);
      
        a = ((x2 - 2*x*px) / k + px*px);
        b = ((xy - x*py - y*px) / k + px*py);
        c = ((y2 - 2*y*py) / k + py*py);
        
        s = ex*ex*a + 2*ex*ey*b + ey*ey*c;
      
        return Math.sqrt(s);
      }
      
      var i, j, m, k,    
      n = path.len,
      pen = new Array(n + 1),
      prev = new Array(n + 1),
      clip0 = new Array(n),
      clip1 = new Array(n + 1),
      seg0 = new Array (n + 1),
      seg1 = new Array(n + 1),
      thispen, best, c;
      
      for (i=0; i<n; i++) {
        c = mod(path.lon[mod(i-1,n)]-1,n);
        if (c == i) {
          c = mod(i+1,n);
        }
        if (c < i) {
          clip0[i] = n;
        } else {
          clip0[i] = c;
        }
      }
      
      j = 1;
      for (i=0; i<n; i++) {
        while (j <= clip0[i]) {
          clip1[j] = i;
          j++;
        }
      }
      
      i = 0;
      for (j=0; i<n; j++) {
        seg0[j] = i;
        i = clip0[i];
      }
      seg0[j] = n;
      m = j;
    
      i = n;
      for (j=m; j>0; j--) {
        seg1[j] = i;
        i = clip1[i];
      }
      seg1[0] = 0;
      
      pen[0]=0;
      for (j=1; j<=m; j++) {
        for (i=seg1[j]; i<=seg0[j]; i++) {
          best = -1;
          for (k=seg0[j-1]; k>=clip1[i]; k--) {
            thispen = penalty3(path, k, i) + pen[k];
            if (best < 0 || thispen < best) {
              prev[i] = k;
              best = thispen;
            }
          }
          pen[i] = best;
        }
      }
      path.m = m;
      path.po = new Array(m);
    
      for (i=n, j=m-1; i>0; j--) {
        i = prev[i];
        path.po[j] = i;
      }
    }
    
    function adjustVertices(path) {
      
      function pointslope(path, i, j, ctr, dir) {
    
        var n = path.len, sums = path.sums,
          x, y, x2, xy, y2,
          k, a, b, c, lambda2, l, r=0;
      
        while (j>=n) {
          j-=n;
          r+=1;
        }
        while (i>=n) {
          i-=n;
          r-=1;
        }
        while (j<0) {
          j+=n;
          r-=1;
        }
        while (i<0) {
          i+=n;
          r+=1;
        }
        
        x = sums[j+1].x-sums[i].x+r*sums[n].x;
        y = sums[j+1].y-sums[i].y+r*sums[n].y;
        x2 = sums[j+1].x2-sums[i].x2+r*sums[n].x2;
        xy = sums[j+1].xy-sums[i].xy+r*sums[n].xy;
        y2 = sums[j+1].y2-sums[i].y2+r*sums[n].y2;
        k = j+1-i+r*n;
        
        ctr.x = x/k;
        ctr.y = y/k;
      
        a = (x2-x*x/k)/k;
        b = (xy-x*y/k)/k;
        c = (y2-y*y/k)/k;
        
        lambda2 = (a+c+Math.sqrt((a-c)*(a-c)+4*b*b))/2;
      
        a -= lambda2;
        c -= lambda2;
      
        if (Math.abs(a) >= Math.abs(c)) {
          l = Math.sqrt(a*a+b*b);
          if (l!==0) {
            dir.x = -b/l;
            dir.y = a/l;
          }
        } else {
          l = Math.sqrt(c*c+b*b);
          if (l!==0) {
            dir.x = -c/l;
            dir.y = b/l;
          }
        }
        if (l===0) {
          dir.x = dir.y = 0; 
        }
      }
      
      var m = path.m, po = path.po, n = path.len, pt = path.pt,
        x0 = path.x0, y0 = path.y0,
        ctr = new Array(m), dir = new Array(m),
        q = new Array(m),
        v = new Array(3), d, i, j, k, l,
        s = new Point();
      
      path.curve = new Curve(m);
  
      for (i=0; i<m; i++) {
        j = po[mod(i+1,m)];
        j = mod(j-po[i],n)+po[i];
        ctr[i] = new Point();
        dir[i] = new Point();
        pointslope(path, po[i], j, ctr[i], dir[i]);
      }
    
      for (i=0; i<m; i++) {
        q[i] = new Quad();
        d = dir[i].x * dir[i].x + dir[i].y * dir[i].y;
        if (d === 0.0) {
          for (j=0; j<3; j++) {
            for (k=0; k<3; k++) {
              q[i].data[j * 3 + k] = 0;
            }
          }
        } else {
          v[0] = dir[i].y;
          v[1] = -dir[i].x;
          v[2] = - v[1] * ctr[i].y - v[0] * ctr[i].x;
          for (l=0; l<3; l++) {
            for (k=0; k<3; k++) {
              q[i].data[l * 3 + k] = v[l] * v[k] / d;
            }
          }
        }
      }
     
      var Q, w, dx, dy, det, min, cand, xmin, ymin, z;
      for (i=0; i<m; i++) {
        Q = new Quad();
        w = new Point();
    
        s.x = pt[po[i]].x-x0;
        s.y = pt[po[i]].y-y0;
    
        j = mod(i-1,m);
        
        for (l=0; l<3; l++) {
          for (k=0; k<3; k++) {
            Q.data[l * 3 + k] = q[j].at(l, k) + q[i].at(l, k);
          }
        }
        
        while(1) {
          
          det = Q.at(0, 0)*Q.at(1, 1) - Q.at(0, 1)*Q.at(1, 0);
          if (det !== 0.0) {
            w.x = (-Q.at(0, 2)*Q.at(1, 1) + Q.at(1, 2)*Q.at(0, 1)) / det;
            w.y = ( Q.at(0, 2)*Q.at(1, 0) - Q.at(1, 2)*Q.at(0, 0)) / det;
            break;
          }
    
          if (Q.at(0, 0)>Q.at(1, 1)) {
            v[0] = -Q.at(0, 1);
            v[1] = Q.at(0, 0);
          } else if (Q.at(1, 1)) {
            v[0] = -Q.at(1, 1);
            v[1] = Q.at(1, 0);
          } else {
            v[0] = 1;
            v[1] = 0;
          }
          d = v[0] * v[0] + v[1] * v[1];
          v[2] = - v[1] * s.y - v[0] * s.x;
          for (l=0; l<3; l++) {
            for (k=0; k<3; k++) {
              Q.data[l * 3 + k] += v[l] * v[k] / d;
            }
          }
        }
        dx = Math.abs(w.x-s.x);
        dy = Math.abs(w.y-s.y);
        if (dx <= 0.5 && dy <= 0.5) {
          path.curve.vertex[i] = new Point(w.x+x0, w.y+y0);
          continue;
        }
    
        min = quadform(Q, s);
        xmin = s.x;
        ymin = s.y;
    
        if (Q.at(0, 0) !== 0.0) {
          for (z=0; z<2; z++) {
            w.y = s.y-0.5+z;
            w.x = - (Q.at(0, 1) * w.y + Q.at(0, 2)) / Q.at(0, 0);
            dx = Math.abs(w.x-s.x);
            cand = quadform(Q, w);
            if (dx <= 0.5 && cand < min) {
              min = cand;
              xmin = w.x;
              ymin = w.y;
            }
          }
        }
  
        if (Q.at(1, 1) !== 0.0) {
          for (z=0; z<2; z++) {
            w.x = s.x-0.5+z;
            w.y = - (Q.at(1, 0) * w.x + Q.at(1, 2)) / Q.at(1, 1);
            dy = Math.abs(w.y-s.y);
            cand = quadform(Q, w);
            if (dy <= 0.5 && cand < min) {
              min = cand;
              xmin = w.x;
              ymin = w.y;
            }
          }
        }
  
        for (l=0; l<2; l++) {
          for (k=0; k<2; k++) {
            w.x = s.x-0.5+l;
            w.y = s.y-0.5+k;
            cand = quadform(Q, w);
            if (cand < min) {
              min = cand;
              xmin = w.x;
              ymin = w.y;
            }
          }
        }
    
        path.curve.vertex[i] = new Point(xmin + x0, ymin + y0);
      }
    }
    
    function reverse(path) {
      var curve = path.curve, m = curve.n, v = curve.vertex, i, j, tmp;
    
      for (i=0, j=m-1; i<j; i++, j--) {
        tmp = v[i];
        v[i] = v[j];
        v[j] = tmp;
      }
    }
    
    function smooth(path) {
      var m = path.curve.n, curve = path.curve;

      var i, j, k, dd, denom, alpha,
        p2, p3, p4;
    
      for (i=0; i<m; i++) {
        j = mod(i+1, m);
        k = mod(i+2, m);
        p4 = interval(1/2.0, curve.vertex[k], curve.vertex[j]);
    
        denom = ddenom(curve.vertex[i], curve.vertex[k]);
        if (denom !== 0.0) {
          dd = dpara(curve.vertex[i], curve.vertex[j], curve.vertex[k]) / denom;
          dd = Math.abs(dd);
          alpha = dd>1 ? (1 - 1.0/dd) : 0;
          alpha = alpha / 0.75;
        } else {
          alpha = 4/3.0;
        }
        curve.alpha0[j] = alpha;
    
        if (alpha >= info.alphamax) { 
          curve.tag[j] = "CORNER";
          curve.c[3 * j + 1] = curve.vertex[j];
          curve.c[3 * j + 2] = p4;
        } else {
          if (alpha < 0.55) {
            alpha = 0.55;
          } else if (alpha > 1) {
            alpha = 1;
          }
          p2 = interval(0.5+0.5*alpha, curve.vertex[i], curve.vertex[j]);
          p3 = interval(0.5+0.5*alpha, curve.vertex[k], curve.vertex[j]);
          curve.tag[j] = "CURVE";
          curve.c[3 * j + 0] = p2;
          curve.c[3 * j + 1] = p3;
          curve.c[3 * j + 2] = p4;
        }
        curve.alpha[j] = alpha;  
        curve.beta[j] = 0.5;
      }
      curve.alphacurve = 1;
    }
    
    function optiCurve(path) {
      function Opti(){
        this.pen = 0;
        this.c = [new Point(), new Point()];
        this.t = 0;
        this.s = 0;
        this.alpha = 0;
      }
      
      function opti_penalty(path, i, j, res, opttolerance, convc, areac) {
        var m = path.curve.n, curve = path.curve, vertex = curve.vertex, 
          k, k1, k2, conv, i1,
          area, alpha, d, d1, d2,
          p0, p1, p2, p3, pt,
          A, R, A1, A2, A3, A4,
          s, t;
      
        if (i==j) {
          return 1;
        }
      
        k = i;
        i1 = mod(i+1, m);
        k1 = mod(k+1, m);
        conv = convc[k1];
        if (conv === 0) {
          return 1;
        }
        d = ddist(vertex[i], vertex[i1]);
        for (k=k1; k!=j; k=k1) {
          k1 = mod(k+1, m);
          k2 = mod(k+2, m);
          if (convc[k1] != conv) {
            return 1;
          }
          if (sign(cprod(vertex[i], vertex[i1], vertex[k1], vertex[k2])) !=
              conv) {
            return 1;
          }
          if (iprod1(vertex[i], vertex[i1], vertex[k1], vertex[k2]) <
              d * ddist(vertex[k1], vertex[k2]) * -0.999847695156) {
            return 1;
          }
        }
    
        p0 = curve.c[mod(i,m) * 3 + 2].copy();
        p1 = vertex[mod(i+1,m)].copy();
        p2 = vertex[mod(j,m)].copy();
        p3 = curve.c[mod(j,m) * 3 + 2].copy();
      
        area = areac[j] - areac[i];
        area -= dpara(vertex[0], curve.c[i * 3 + 2], curve.c[j * 3 + 2])/2;
        if (i>=j) {
          area += areac[m];
        }
      
        A1 = dpara(p0, p1, p2);
        A2 = dpara(p0, p1, p3);
        A3 = dpara(p0, p2, p3);
  
        A4 = A1+A3-A2;    
        
        if (A2 == A1) {
          return 1;
        }
      
        t = A3/(A3-A4);
        s = A2/(A2-A1);
        A = A2 * t / 2.0;
        
        if (A === 0.0) {
          return 1;
        }
      
        R = area / A;
        alpha = 2 - Math.sqrt(4 - R / 0.3);
      
        res.c[0] = interval(t * alpha, p0, p1);
        res.c[1] = interval(s * alpha, p3, p2);
        res.alpha = alpha;
        res.t = t;
        res.s = s;
      
        p1 = res.c[0].copy();
        p2 = res.c[1].copy(); 
      
        res.pen = 0;
      
        for (k=mod(i+1,m); k!=j; k=k1) {
          k1 = mod(k+1,m);
          t = tangent(p0, p1, p2, p3, vertex[k], vertex[k1]);
          if (t<-0.5) {
            return 1;
          }
          pt = bezier(t, p0, p1, p2, p3);
          d = ddist(vertex[k], vertex[k1]);
          if (d === 0.0) {
            return 1;
          }
          d1 = dpara(vertex[k], vertex[k1], pt) / d;
          if (Math.abs(d1) > opttolerance) {
            return 1;
          }
          if (iprod(vertex[k], vertex[k1], pt) < 0 ||
              iprod(vertex[k1], vertex[k], pt) < 0) {
            return 1;
          }
          res.pen += d1 * d1;
        }
      
        for (k=i; k!=j; k=k1) {
          k1 = mod(k+1,m);
          t = tangent(p0, p1, p2, p3, curve.c[k * 3 + 2], curve.c[k1 * 3 + 2]);
          if (t<-0.5) {
            return 1;
          }
          pt = bezier(t, p0, p1, p2, p3);
          d = ddist(curve.c[k * 3 + 2], curve.c[k1 * 3 + 2]);
          if (d === 0.0) {
            return 1;
          }
          d1 = dpara(curve.c[k * 3 + 2], curve.c[k1 * 3 + 2], pt) / d;
          d2 = dpara(curve.c[k * 3 + 2], curve.c[k1 * 3 + 2], vertex[k1]) / d;
          d2 *= 0.75 * curve.alpha[k1];
          if (d2 < 0) {
            d1 = -d1;
            d2 = -d2;
          }
          if (d1 < d2 - opttolerance) {
            return 1;
          }
          if (d1 < d2) {
            res.pen += (d1 - d2) * (d1 - d2);
          }
        }
      
        return 0;
      }
    
      var curve = path.curve, m = curve.n, vert = curve.vertex, 
        pt = new Array(m + 1),
        pen = new Array(m + 1),
        len = new Array(m + 1),
        opt = new Array(m + 1),
        om, i,j,r,
        o = new Opti(), p0,
        i1, area, alpha, ocurve,
        s, t;
      
      var convc = new Array(m), areac = new Array(m + 1);
      
      for (i=0; i<m; i++) {
        if (curve.tag[i] == "CURVE") {
          convc[i] = sign(dpara(vert[mod(i-1,m)], vert[i], vert[mod(i+1,m)]));
        } else {
          convc[i] = 0;
        }
      }
    
      area = 0.0;
      areac[0] = 0.0;
      p0 = curve.vertex[0];
      for (i=0; i<m; i++) {
        i1 = mod(i+1, m);
        if (curve.tag[i1] == "CURVE") {
          alpha = curve.alpha[i1];
          area += 0.3 * alpha * (4-alpha) *
              dpara(curve.c[i * 3 + 2], vert[i1], curve.c[i1 * 3 + 2])/2;
          area += dpara(p0, curve.c[i * 3 + 2], curve.c[i1 * 3 + 2])/2;
        }
        areac[i+1] = area;
      }
    
      pt[0] = -1;
      pen[0] = 0;
      len[0] = 0;
    
    
      for (j=1; j<=m; j++) {
        pt[j] = j-1;
        pen[j] = pen[j-1];
        len[j] = len[j-1]+1;
    
        for (i=j-2; i>=0; i--) {
          r = opti_penalty(path, i, mod(j,m), o, info.opttolerance, convc, 
              areac);
          if (r) {
            break;
          }
            if (len[j] > len[i]+1 ||
                (len[j] == len[i]+1 && pen[j] > pen[i] + o.pen)) {
              pt[j] = i;
              pen[j] = pen[i] + o.pen;
              len[j] = len[i] + 1;
              opt[j] = o;
              o = new Opti();
            }
        }
      }
      om = len[m];
      ocurve = new Curve(om);
      s = new Array(om);
      t = new Array(om);
    
      j = m;
      for (i=om-1; i>=0; i--) {
        if (pt[j]==j-1) {
          ocurve.tag[i]     = curve.tag[mod(j,m)];
          ocurve.c[i * 3 + 0]    = curve.c[mod(j,m) * 3 + 0];
          ocurve.c[i * 3 + 1]    = curve.c[mod(j,m) * 3 + 1];
          ocurve.c[i * 3 + 2]    = curve.c[mod(j,m) * 3 + 2];
          ocurve.vertex[i]  = curve.vertex[mod(j,m)];
          ocurve.alpha[i]   = curve.alpha[mod(j,m)];
          ocurve.alpha0[i]  = curve.alpha0[mod(j,m)];
          ocurve.beta[i]    = curve.beta[mod(j,m)];
          s[i] = t[i] = 1.0;
        } else {
          ocurve.tag[i] = "CURVE";
          ocurve.c[i * 3 + 0] = opt[j].c[0];
          ocurve.c[i * 3 + 1] = opt[j].c[1];
          ocurve.c[i * 3 + 2] = curve.c[mod(j,m) * 3 + 2];
          ocurve.vertex[i] = interval(opt[j].s, curve.c[mod(j,m) * 3 + 2],
                                       vert[mod(j,m)]);
          ocurve.alpha[i] = opt[j].alpha;
          ocurve.alpha0[i] = opt[j].alpha;
          s[i] = opt[j].s;
          t[i] = opt[j].t;
        }
        j = pt[j];
      }
    
      for (i=0; i<om; i++) {
        i1 = mod(i+1,om);
        ocurve.beta[i] = s[i] / (s[i] + t[i1]);
      }
      ocurve.alphacurve = 1;
      path.curve = ocurve;
    }
    
    for (var i = 0; i < pathlist.length; i++) {
      var path = pathlist[i];
      calcSums(path);
      calcLon(path);
      bestPolygon(path);
      adjustVertices(path);
      
      if (path.sign === "-") {
        reverse(path);
      }
      
      smooth(path);
      
      if (info.optcurve) {
        optiCurve(path);
      }
    }
  
  }

  function process(c) {
    if (c) {
      callback = c;
    }
    if (!info.isReady) {
      setTimeout(process, 100);
      return;
    }
    bmToPathlist();
    processPath();
    callback();
    callback = null;
  }

  function clear() {
    bm = null;
    pathlist = [];
    callback = null;
    info.isReady = false;
  }
  
  function getSVG(size, opt_type) {
  
    function path(curve) {
    
      function bezier(i) {
        var b = 'C ' + (curve.c[i * 3 + 0].x * size).toFixed(3) + ' ' +
            (curve.c[i * 3 + 0].y * size).toFixed(3) + ',';
        b += (curve.c[i * 3 + 1].x * size).toFixed(3) + ' ' +
            (curve.c[i * 3 + 1].y * size).toFixed(3) + ',';
        b += (curve.c[i * 3 + 2].x * size).toFixed(3) + ' ' +
            (curve.c[i * 3 + 2].y * size).toFixed(3) + ' ';
        return b;
      }
    
      function segment(i) {
        var s = 'L ' + (curve.c[i * 3 + 1].x * size).toFixed(3) + ' ' +
            (curve.c[i * 3 + 1].y * size).toFixed(3) + ' ';
        s += (curve.c[i * 3 + 2].x * size).toFixed(3) + ' ' +
            (curve.c[i * 3 + 2].y * size).toFixed(3) + ' ';
        return s;
      }

      var n = curve.n, i;
      var p = 'M' + (curve.c[(n - 1) * 3 + 2].x * size).toFixed(3) +
          ' ' + (curve.c[(n - 1) * 3 + 2].y * size).toFixed(3) + ' ';
      for (i = 0; i < n; i++) {
        if (curve.tag[i] === "CURVE") {
          p += bezier(i);
        } else if (curve.tag[i] === "CORNER") {
          p += segment(i);
        }
      }
      //p += 
      return p;
    }

    var w = bm.w * size, h = bm.h * size,
      len = pathlist.length, c, i, strokec, fillc, fillrule;

    var svg = '<svg id="svg" version="1.1" width="' + w + '" height="' + h +
        '" xmlns="http://www.w3.org/2000/svg">';
    svg += '<path d="';
    for (i = 0; i < len; i++) {
      c = pathlist[i].curve;
      svg += path(c);
    }
    if (opt_type === "curve") {
      strokec = "black";
      fillc = "none";
      fillrule = '';
    } else {
      strokec = "none";
      fillc = "black";
      fillrule = ' fill-rule="evenodd"';
    }
    svg += '" stroke="' + strokec + '" fill="' + fillc + '"' + fillrule + '/></svg>';
    return svg;
  }
  
  


const Potrace = {
    loadImageFromFile: loadImageFromFile,
    loadImageFromUrl: loadImageFromUrl,
    setParameter: setParameter,
    process: process,
    getSVG: getSVG,
    img: imgElement
};

export default Potrace;
