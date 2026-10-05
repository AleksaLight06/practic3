const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const tray = document.getElementById('stickerTray');
const boardArea = document.getElementById('boardArea');

let colorIndex = 0;
const COLORS = ['c1', 'c2', 'c3', 'c4', 'c5'];

// ---------- Создание стикера ----------
function createSticker(text) {
    const el = document.createElement('div');
    el.className = 'sticker ' + COLORS[colorIndex % COLORS.length];
    colorIndex++;

    // текст
    const txt = document.createElement('span');
    txt.textContent = text;
    el.append(txt);

    // крестик удаления
    const remove = document.createElement('span');
    remove.className = 'remove';
    remove.textContent = '×';
    remove.title = 'Удалить';
    remove.addEventListener('pointerdown', (e) => e.stopPropagation());
    remove.addEventListener('click', (e) => {
        e.stopPropagation();
        el.remove();
    });
    el.append(remove);

    // двойной клик — тоже удалить
    el.addEventListener('dblclick', () => el.remove());

    // перетаскивание
    enableDrag(el);

    return el;
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        taskInput.focus();
        return;
    }
    tray.append(createSticker(text));
    taskInput.value = '';
    taskInput.focus();
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
});

// ---------- Перетаскивание (Pointer Events) ----------
function enableDrag(el) {
    let startX = 0, startY = 0;
    let origLeft = 0, origTop = 0;
    let offsetX = 0, offsetY = 0;
    let dragging = false;

    el.addEventListener('pointerdown', (e) => {
        // не тащим за крестик
        if (e.target.classList.contains('remove')) return;

        dragging = true;
        el.setPointerCapture(e.pointerId);
        el.classList.add('dragging');

        const rect = el.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // если стикер ещё в панели — приподнимем его (для наглядности)
        if (el.parentElement === tray) {
            el.style.position = 'relative';
            el.style.zIndex = 10;
        } else {
            origLeft = parseFloat(el.style.left) || 0;
            origTop = parseFloat(el.style.top) || 0;
        }
    });

    el.addEventListener('pointermove', (e) => {
        if (!dragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (el.parentElement === tray) {
            // визуально двигаем внутри панели
            el.style.transform = `translate(${dx}px, ${dy}px)`;
        } else {
            // двигаем по доске
            el.style.left = (origLeft + dx) + 'px';
            el.style.top = (origTop + dy) + 'px';
        }
    });

    el.addEventListener('pointerup', (e) => {
        if (!dragging) return;
        dragging = false;
        el.classList.remove('dragging');
        el.releasePointerCapture(e.pointerId);

        // если стикер был в панели — проверим, попал ли он на доску
        if (el.parentElement === tray) {
            el.style.transform = '';
            el.style.zIndex = '';

            const boardRect = boardArea.getBoundingClientRect();
            const inBoard =
                e.clientX >= boardRect.left && e.clientX <= boardRect.right &&
                e.clientY >= boardRect.top && e.clientY <= boardRect.bottom;

            if (inBoard) {
                // переносим на доску
                boardArea.append(el);
                el.style.position = 'absolute';
                el.style.left = (e.clientX - boardRect.left - offsetX) + 'px';
                el.style.top = (e.clientY - boardRect.top - offsetY) + 'px';
            }
        } else {
            // ограничим внутри доски
            const boardRect = boardArea.getBoundingClientRect();
            const w = el.offsetWidth, h = el.offsetHeight;
            let left = parseFloat(el.style.left) || 0;
            let top = parseFloat(el.style.top) || 0;

            left = Math.max(0, Math.min(left, boardRect.width - w));
            top = Math.max(0, Math.min(top, boardRect.height - h));

            el.style.left = left + 'px';
            el.style.top = top + 'px';
        }
    });

    el.addEventListener('pointercancel', () => {
        dragging = false;
        el.classList.remove('dragging');
        el.style.transform = '';
        el.style.zIndex = '';
    });
}