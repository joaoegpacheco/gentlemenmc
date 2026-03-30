import printJS from "print-js";

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

const PRINT_STYLE = `
  #print-area {
    font-family: arial;
  }
  .ticket {
    width: 300px;
    padding: 10px;
    margin-bottom: 15px;
    border-bottom: 1px dashed #000;
  }
  .drink {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .info {
    font-size: 30px;
  }
`;

/**
 * Monta o DOM com createElement/textContent (sem innerHTML) para evitar erro de
 * Trusted Types no Chromium: "The provided callback is no longer runnable".
 */
export function printComandaHTML({ guestName, items }: PrintOptions) {
  if (typeof window === "undefined") return;

  const containerId = "print-container";

  const existing = document.getElementById(containerId);
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = containerId;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";

  const styleEl = document.createElement("style");
  styleEl.textContent = PRINT_STYLE;

  const printArea = document.createElement("div");
  printArea.id = "print-area";

  const dateTime = formatDateTime();

  for (const item of items) {
    for (let q = 0; q < item.quantity; q++) {
      const ticket = document.createElement("div");
      ticket.className = "ticket";

      const drinkEl = document.createElement("div");
      drinkEl.className = "drink";
      drinkEl.textContent = item.drink;

      const infoName = document.createElement("div");
      infoName.className = "info";
      infoName.textContent = `Nome: ${guestName}`;

      const infoDate = document.createElement("div");
      infoDate.className = "info";
      infoDate.textContent = `Data: ${dateTime}`;

      const infoPrice = document.createElement("div");
      infoPrice.className = "info";
      infoPrice.textContent = `Preço: R$ ${item.price.toFixed(2)}`;

      ticket.append(drinkEl, infoName, infoDate, infoPrice);
      printArea.appendChild(ticket);
    }
  }

  container.append(styleEl, printArea);
  document.body.appendChild(container);

  const removeContainer = () => {
    container.remove();
  };

  printJS({
    printable: containerId,
    type: "html",
    scanStyles: true,
    onPrintDialogClose: removeContainer,
  });
}
