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

export function printComandaHTML({ guestName, items }: PrintOptions) {
  if (typeof window === "undefined") return;

  const containerId = "print-container";

  // Remover container anterior, caso exista (evita duplicação)
  const existing = document.getElementById(containerId);
  if (existing) existing.remove();

  const container = document.createElement("div");
  container.id = containerId;

  // Ao invés de display none, usar position absolute e fora da tela
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";

  document.body.appendChild(container);

  const dateTime = formatDateTime();

  const ticketsHTML = items
    .flatMap((item) =>
      Array.from({ length: item.quantity }).map(
        () => `
        <div class="ticket">
          <div class="drink">${item.drink}</div>
          <div class="info">Nome: ${guestName}</div>
          <div class="info">Data: ${dateTime}</div>
          <div class="info">Preço: R$ ${item.price.toFixed(2)}</div>
        </div>
      `
      )
    )
    .join("");

  container.innerHTML = `
    <div id="print-area">
      ${ticketsHTML}
    </div>
    <style>
      #print-area {
        font-family: monospace;
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
    </style>
  `;

  printJS({
    printable: containerId,
    type: "html",
    scanStyles: true,    // Para garantir que os estilos aplicados sejam considerados
    onPrintDialogClose: () => container.remove(),
  });
}
