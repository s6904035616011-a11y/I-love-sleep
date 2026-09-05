document.addEventListener('DOMContentLoaded', () => {
  // ดึงชื่อไฟล์ของหน้าที่เปิดอยู่
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  if (page === 'product.html') {
    initProductPage();
  } else if (page === 'order.html') {
    initOrderPage();
  } else if (page === 'admin.html') {
    initAdminPage();
  }
});

/* ==========================================================================
   1. PRODUCT PAGE (product.html)
   ========================================================================== */
function initProductPage() {
  const productList = document.getElementById('product-list');
  const filterBar = document.getElementById('filter-bar');
  if (!productList) return;

  // อ่าน URL Parameter ?mood=xxx
  const urlParams = new URLSearchParams(window.location.search);
  const currentMood = urlParams.get('mood') || 'all';

  // ดึงข้อมูลสินค้าจาก products.json
  fetch('products.json')
    .then(response => {
      if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
      return response.json();
    })
    .then(products => {
      // ทำการกรองสินค้าตาม URL Parameter (ถ้ามี)
      renderProducts(products, currentMood, productList);
      setupFilters(products, currentMood, productList, filterBar);
    })
    .catch(error => {
      console.error(error);
      productList.innerHTML = '<p class="error-msg">เกิดข้อผิดพลาดในการโหลดรายการสินค้า</p>';
    });
}

function renderProducts(products, filterMood, container) {
  container.innerHTML = '';

  const filteredProducts = filterMood === 'all' 
    ? products 
    : products.filter(p => p.mood === filterMood);

  if (filteredProducts.length === 0) {
    container.innerHTML = '<p>ไม่พบสินค้าในหมวดหมู่นี้</p>';
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    // แปลงชื่อ mood เป็นภาษาไทยสำหรับแสดงผล
    const moodMap = {
      support: 'Support & Rest',
      relax: 'Relaxation',
      cooling: 'Cooling Touch',
      allergy: 'Anti-Allergy'
    };

    // ลิงก์ไปหน้า order.html พร้อมส่ง item และ price
    const orderUrl = `order.html?item=${encodeURIComponent(product.name)}&price=${product.price}`;

    card.innerHTML = `
      <div>
        <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
        <div class="mood-badge" data-mood="${product.mood}">${moodMap[product.mood] || product.mood}</div>
        <h3 class="product-title">${product.name}</h3>
        <p>${product.description}</p>
      </div>
      <div>
        <div class="product-price">฿${product.price.toLocaleString()}</div>
        <a href="${orderUrl}" class="btn btn-accent" style="display: block; text-align: center; margin-top: 16px;">สั่งซื้อ</a>
      </div>
    `;

    container.appendChild(card);
  });
}

function setupFilters(products, activeMood, productContainer, filterContainer) {
  if (!filterContainer) return;

  const buttons = filterContainer.querySelectorAll('button, .filter-btn');
  
  // Highlight ปุ่มตั้งต้นตาม activeMood
  buttons.forEach(btn => {
    const mood = btn.dataset.mood || 'all';
    if (mood === activeMood) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts(products, mood, productContainer);
    });
  });
}

/* ==========================================================================
   2. ORDER PAGE (order.html)
   ========================================================================== */
function initOrderPage() {
  const orderForm = document.getElementById('orderForm');
  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');

  // อ่าน URL Parameter
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  // เติมค่าลงใน Form อัตโนมัติทันทีที่โหลดหน้า
  if (itemsInput && itemParam) {
    itemsInput.value = itemParam;
  }
  if (totalInput && priceParam) {
    totalInput.value = priceParam;
  }

  // จัดการการส่งฟอร์มด้วย Google Apps Script
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const customerName = document.getElementById('customerName')?.value || '';
      const contact = document.getElementById('contact')?.value || '';
      const items = document.getElementById('items')?.value || '';
      const total = document.getElementById('total')?.value || '';
      const note = document.getElementById('note')?.value || '';

      const payload = {
        customerName,
        contact,
        items,
        total,
        note
      };

      const submitBtn = orderForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'กำลังส่งข้อมูล...';
      }

      // ส่งแบบ POST + JSON.stringify ตาม Pattern ที่กำหนด
      fetch('https://script.google.com/macros/s/AKfycby4AIEElwKLB4v42QptrImCOQ0im3bLhUgbL3qp6EklBAHWtj9qwAkzDBcDXohRly-hYw/exec', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'ยืนยันสั่งซื้อ';
        }
      });
    });
  }
}

/* ==========================================================================
   3. ADMIN PAGE (admin.html)
   ========================================================================== */
function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');
  if (!tbody) return;

  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfKqGhywDkS4krMzDm-NcEN4YX6dBCigWl8bFiiR3yY2qN7-DS5EU8nAILYzxhWKaW0QrbtAH_dZqO/pub?gid=0&single=true&output=csv';

  fetch(csvUrl)
    .then(response => {
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
      return response.text();
    })
    .then(csvText => {
      const rows = parseCSV(csvText);
      if (rows.length < 2) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">ยังไม่มีข้อมูลคำสั่งซื้อ</td></tr>';
        return;
      }

      // ข้าม Row แถวแรกที่เป็น Header
      const dataRows = rows.slice(1);

      // เรียงลำดับจากรายการล่าสุดขึ้นก่อน (Reverse)
      dataRows.reverse();

      tbody.innerHTML = '';
      dataRows.forEach(row => {
        if (row.length < 2 || !row.some(cell => cell.trim() !== '')) return; // ข้ามแถวว่าง

        const tr = document.createElement('tr');
        
        // อ่านค่าคอลัมน์ (วันเวลา, ชื่อลูกค้า, เบอร์โทร/Line, รายการสินค้า, จำนวนเงินรวม, หมายเหตุ)
        const date = row[0] || '-';
        const name = row[1] || '-';
        const contact = row[2] || '-';
        const items = row[3] || '-';
        const total = row[4] ? Number(row[4]).toLocaleString() : '-';
        const note = row[5] || '-';

        tr.innerHTML = `
          <td>${escapeHtml(date)}</td>
          <td>${escapeHtml(name)}</td>
          <td>${escapeHtml(contact)}</td>
          <td>${escapeHtml(items)}</td>
          <td>฿${escapeHtml(total)}</td>
          <td>${escapeHtml(note)}</td>
        `;

        tbody.appendChild(tr);
      });
    })
    .catch(error => {
      console.error(error);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    });
}

/**
 * Custom CSV Parser รองรับ Comma และ Quotes
 */
function parseCSV(text) {
  const result = [];
  let row = [];
  let cell = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        cell += '"';
        i++; // ข้าม quote ตัวถัดไป
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++; // ข้าม \n สำหรับ \r\n
      }
      row.push(cell.trim());
      if (row.length > 0 && row.some(c => c !== '')) {
        result.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }

  return result;
}

/**
 * Helper ป้องกัน XSS
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}