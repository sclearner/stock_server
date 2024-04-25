const signUpForm = document.forms["sign-up"];
const signInForm = document.forms["sign-in"];
const balanceTable = document.getElementById("balance");

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
    accessToken = token.accessToken;
    await updateBalance();
    alert(JSON.stringify(token));
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
    alert(JSON.stringify(result));
  } catch (e) {
    alert(JSON.stringify(e));
  }
});

let balance;

async function updateBalance() {
    try {
        const response = await fetch('/api/v1/trader', {
        headers: {
            "x-access-token": accessToken
        }
        });
        const result = await response.json();
        if (response.statusCode !== 200) throw result;
        balance = [...result];
        for (const currency of balance) {
            const row = document.createElement('tr');
            const currencyCell = document.createElement('td');
            currencyCell.setAttribute('data-currency', currency.currency);
            currencyCell.textContent = currency.currency;
            const amountCell = document.createElement('td');
            amountCell.setAttribute('data-amount', amount);
            amountCell.textContent = amount;
            row.appendChild(currencyCell);
            row.appendChild(amountCell);
            balanceTable.appendChild(row);
        }
    }
    catch (e) {
        console.log(e);
    }
}

document.getElementById("reload").addEventListener("click", updateBalance);