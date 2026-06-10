type Item = {
  drink: string;
  quantity: number;
  price: number;
};

type PrintOptions = {
  guestName: string;
  items: Item[];
};

function formatDateTime() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/** Bobina térmica 80mm: área útil ~72mm. Em 58mm o texto quebra linha sem cortar. */
const THERMAL_PAPER_MM = 80;
const THERMAL_PRINTABLE_MM = 72;

const PRINT_STYLE = `
  @page {
    size: ${THERMAL_PAPER_MM}mm auto;
    margin: 2mm;
  }
  #print-container,
  #print-area,
  #print-area * {
    position: static !important;
    left: auto !important;
    top: auto !important;
    visibility: visible !important;
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    box-sizing: border-box;
  }
  #print-container,
  #print-area {
    max-width: ${THERMAL_PRINTABLE_MM}mm;
    width: 100%;
    font-family: arial, sans-serif;
  }
  .ticket {
    max-width: ${THERMAL_PRINTABLE_MM}mm;
    width: 100%;
    padding: 2mm;
    margin-bottom: 4mm;
    border-bottom: 1px dashed #000;
  }
  #print-area .drink,
  #print-area .info {
    display: block;
    text-align: left;
    line-height: 1.2;
    margin: 0;
    max-width: 100%;
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  #print-area .drink {
    font-size: 27pt !important;
    font-weight: bold;
  }
  #print-area .info {
    font-size: 14pt !important;
  }
  html,
  body {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
`;

function applyBlackText(el: HTMLElement) {
  el.style.setProperty("color", "#000000", "important");
  el.style.setProperty("-webkit-text-fill-color", "#000000", "important");
  el.style.opacity = "1";
}

/**
 * Monta o DOM com createElement/textContent (sem innerHTML) para evitar erro de
 * Trusted Types no Chromium: "The provided callback is no longer runnable".
 */
export async function printComandaHTML({ guestName, items }: PrintOptions) {
  if (typeof window === "undefined") return;

  const { default: printJS } = await import("print-js");

  const containerId = "print-container";

  const existing = document.getElementById(containerId);
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = containerId;
  applyBlackText(container);

  const printArea = document.createElement("div");
  printArea.id = "print-area";
  applyBlackText(printArea);

  const dateTime = formatDateTime();

  for (const item of items) {
    for (let q = 0; q < item.quantity; q++) {
      const ticket = document.createElement("div");
      ticket.className = "ticket";
      applyBlackText(ticket);

      const drinkEl = document.createElement("div");
      drinkEl.className = "drink";
      drinkEl.textContent = item.drink;
      applyBlackText(drinkEl);

      const infoName = document.createElement("div");
      infoName.className = "info";
      infoName.textContent = `Nome: ${guestName}`;
      applyBlackText(infoName);

      const infoDate = document.createElement("div");
      infoDate.className = "info";
      infoDate.textContent = `Data: ${dateTime}`;
      applyBlackText(infoDate);

      const infoPrice = document.createElement("div");
      infoPrice.className = "info";
      infoPrice.textContent = `Preço: R$ ${item.price.toFixed(2)}`;
      applyBlackText(infoPrice);

      ticket.append(
        drinkEl,
        document.createElement("br"),
        infoName,
        document.createElement("br"),
        infoDate,
        document.createElement("br"),
        infoPrice
      );
      printArea.appendChild(ticket);
    }
  }

  container.appendChild(printArea);
  document.body.appendChild(container);

  const removeContainer = () => {
    container.remove();
  };

  printJS({
    printable: containerId,
    type: "html",
    scanStyles: false,
    style: PRINT_STYLE,
    font_size: "",
    honorColor: true,
    onPrintDialogClose: removeContainer,
  });
}
