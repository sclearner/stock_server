const signUpForm = document.forms["sign-up"];
const signInForm = document.forms["sign-in"];
const balanceTable = document.getElementById("balance");
const instrumentTable = document.getElementById("instrument");

let accessToken;

signInForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formResult = new FormData(signInForm);
  const name = formResult.get("username");
  const password = formResult.get("password");
  try {
    const result = await fetch("/api/v1/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, password }),
    });
    const token = await result.json();
    if (result.status > 399) throw token;
    localStorage.setItem('token', token.accessToken);
    localStorage.setItem('refresh-token', token.refreshToken);
    await updateBalance();
    //alert(JSON.stringify(token));
  } catch (err) {
    alert(JSON.stringify(err));
  }
});

signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formResult = new FormData(signUpForm);
  const name = formResult.get("username");
  const password = formResult.get("password");
  const email = formResult.get("email");
  try {
    const response = await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    const result = await response.json();
    if (response.status > 399) throw result;
    //alert(JSON.stringify(result));
  } catch (e) {
    alert(JSON.stringify(e));
  }
});

let balance;

async function updateBalance() {
    try {
        const response = await fetch('/api/v1/trader', {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem('token')
        }
        });
        const result = await response.json();
        if (response.status !== 200) throw result;
        balance = [...result];
        balanceTable.innerHTML = '';
        for (const currency of balance) {
            const row = document.createElement('tr');
            const currencyCell = document.createElement('td');
            currencyCell.setAttribute('data-currency', currency.currency);
            currencyCell.textContent = currency.currency;
            const amountCell = document.createElement('td');
            amountCell.setAttribute('data-amount', currency.amount);
            amountCell.textContent = new Intl.NumberFormat().format(currency.amount);
            row.appendChild(currencyCell);
            row.appendChild(amountCell);
            balanceTable.appendChild(row);
        }
    }
    catch (e) {
        console.log(e);
    }
}

async function updateInstruments() {
  try {
      const response = await fetch('/api/v1/instrument');
      const result = await response.json();
      if (response.status !== 200) throw result;
      instruments = [...result];
      instrumentTable.innerHTML = '';
      for (const instrument of instruments) {
          const row = document.createElement('tr');
          const currencyCell = document.createElement('td');
          currencyCell.setAttribute('data-symbol', instrument.symbol);
          currencyCell.textContent = instrument.symbol;

          const lastPriceCell = document.createElement('td');
          lastPriceCell.setAttribute('data-last-price', instrument.currentPrice);
          lastPriceCell.textContent = new Intl.NumberFormat().format(instrument.currentPrice);

          const amountCell = document.createElement('td');
          amountCell.setAttribute('data-last-price', instrument.dayPrice);
          amountCell.textContent = new Intl.NumberFormat().format(instrument.dayPrice);

          row.appendChild(currencyCell);
          row.appendChild(lastPriceCell);
          row.appendChild(amountCell);
          instrumentTable.appendChild(row);
      }
  }
  catch (e) {
      console.log(e);
  }
}

setInterval(updateInstruments, 1000);

document.getElementById("reload").addEventListener("click", updateBalance);
document.getElementById("sign-out").addEventListener("click", (e) => {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh-token");
});