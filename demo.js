let playerPos, playerVel, playerSize;
let interactables = [];
let dialogueTriggers = {};
let dialog = {
    lines: [],
    index: 0,
    showing: false
};

let touchStart = { x: 0, y: 0 };
let dragging = false;

function setup() {
    createCanvas(windowWidth, windowHeight);
    textAlign(LEFT, TOP);
    rectMode(CENTER);
    textSize(14);

    playerPos = createVector(0, 0);
    playerVel = createVector(0, 0);
    playerSize = createVector(20, 20);

    addEntity(60, 0, 30, 30, "npc_1");
    addEntity(-80, -40, 40, 40, "npc_2");

    dialogueTriggers["npc_1"] = "Hey! This world is now 2D-ish in p5.js!";
    dialogueTriggers["npc_2"] = "Swipe to move! Tap anywhere to talk!";
}

function draw() {
    background(50);

    push();
    translate(width / 2 - playerPos.x, height / 2 - playerPos.y);

    updatePlayer();

    drawEntity(playerPos, playerSize, color(255, 255, 0));

    for (let ent of interactables) {
        drawEntity(ent.pos, ent.size, color(100, 200, 255));
        let txt = dialogueTriggers[ent.id];
        triggerIfOverlap(playerPos, playerSize, ent.pos, ent.size, txt);
    }

    pop();

    drawDialog();
}

function updatePlayer() {
    if (dialog.showing) {
        playerVel.set(0, 0);
        return;
    }
    playerPos.add(playerVel);
    playerVel.mult(0.8);
}

function drawEntity(pos, size, col) {
    fill(col);
    noStroke();
    rect(pos.x, pos.y, size.x, size.y);
}

function triggerIfOverlap(a, sa, b, sb, text) {
    if (dialog.showing || !text) return;

    let ax1 = a.x - sa.x / 2;
    let ax2 = a.x + sa.x / 2;
    let ay1 = a.y - sa.y / 2;
    let ay2 = a.y + sa.y / 2;

    let bx1 = b.x - sb.x / 2;
    let bx2 = b.x + sb.x / 2;
    let by1 = b.y - sb.y / 2;
    let by2 = b.y + sb.y / 2;

    let overlapping = !(ax2 < bx1 || ax1 > bx2 || ay2 < by1 || ay1 > by2);
    if (overlapping) {
        setDialog(text);
    }
}

function drawDialog() {
    if (!dialog.showing) return;

    let padding = 12;
    let lineHeight = 18;
    let boxW = width - 80;
    let boxH = padding * 2 + lineHeight;

    let line = dialog.lines[dialog.index];

    push();
    translate(width / 2, height - 80);
    fill(255, 240);
    rect(0, 0, boxW, boxH, 6);

    fill(0);
    textAlign(LEFT, TOP);
    text(line, -boxW / 2 + padding, -boxH / 2 + padding);
    pop();
}

function setDialog(text) {
    let words = text.split(/\s+/);
    let lines = [];
    let line = "";
    let maxChars = 40;

    for (let word of words) {
        let testLine = line === "" ? word : line + " " + word;
        if (testLine.length <= maxChars) {
            line = testLine;
        } else {
            lines.push(line);
            line = word;
        }
    }
    if (line !== "") lines.push(line);

    dialog.lines = lines;
    dialog.index = 0;
    dialog.showing = true;
}

function addEntity(x, y, w, h, id) {
    interactables.push({
        pos: createVector(x, y),
        size: createVector(w, h),
        id: id
    });
}

function touchStarted() {
    touchStart.x = mouseX;
    touchStart.y = mouseY;
    dragging = true;
    return false;
}

function touchEnded() {
    if (!dragging) return false;
    let dx = mouseX - touchStart.x;
    let dy = mouseY - touchStart.y;
    let distMoved = dist(mouseX, mouseY, touchStart.x, touchStart.y);

    if (dialog.showing) {
        if (distMoved < 10) {
            dialog.index++;
            if (dialog.index >= dialog.lines.length) {
                dialog.showing = false;
            }
        }
    } else {
        if (distMoved >= 20) {
            if (abs(dx) > abs(dy)) {
                playerVel.x = dx > 0 ? 3 : -3;
            } else {
                playerVel.y = dy > 0 ? 3 : -3;
            }
        }
    }

    dragging = false;
    return false;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
