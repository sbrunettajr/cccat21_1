import crypto from "crypto";
import axios from "axios";

import { isValidAssetId } from "../src/signup"

axios.defaults.validateStatus = () => true;

test("Deve criar uma conta válida", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(outputSignup.accountId).toBeDefined();
    const responseGetAccount = await axios.get(`http://localhost:3000/accounts/${outputSignup.accountId}`);
    const outputGetAccount = responseGetAccount.data;
    expect(outputGetAccount.name).toBe(inputSignup.name);
    expect(outputGetAccount.email).toBe(inputSignup.email);
    expect(outputGetAccount.document).toBe(inputSignup.document);
});

test("Não deve criar uma conta com nome inválido", async () => {
    const inputSignup = {
        name: "John",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(422);
    expect(outputSignup.error).toBe("Invalid name");
});

test("Não deve criar uma conta com email inválido", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(422);
    expect(outputSignup.error).toBe("Invalid email");
});

test.each([
    "111",
    "abc",
    "7897897897"
])("Não deve criar uma conta com cpf inválido", async (document: string) => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document,
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(422);
    expect(outputSignup.error).toBe("Invalid document");
});

test("Não deve criar uma conta com senha inválida", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(422);
    expect(outputSignup.error).toBe("Invalid password");
});

test("Deve realizar um depósito com sucesso", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    expect(responseSignup.data.accountId).toBeDefined()

    const inputDeposit = {
        accountId: responseSignup.data.accountId,
        assetId: 'BTC',
        quantity: 10
    }
    const responseDeposit = await axios.post('http://localhost:3000/deposit', inputDeposit)
    expect(responseDeposit.status).toBe(204)
})

test.each([
    "BTC",
    "USD"
])("Deve validar o assetId", async (assetId: string) => {
    const isValid = isValidAssetId(assetId)

    expect(isValid).toBeTruthy()
})

test.each([
    "BRL",
])("Não deve validar o assetId", async (assetId: string) => {
    const isValid = isValidAssetId(assetId)

    expect(isValid).toBeFalsy()
})

test("Não deve realizar um depósito com o assetId inválido", async() => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    expect(responseSignup.data.accountId).toBeDefined()

    const inputDeposit = {
        accountId: responseSignup.data.accountId,
        assetId: 'BRL',
        quantity: 10
    }
    const responseDeposit = await axios.post('http://localhost:3000/deposit', inputDeposit)
    const outputDeposit = responseDeposit.data;
    expect(responseDeposit.status).toBe(422);
    expect(outputDeposit.error).toBe("Invalid assetId");
})

test.each([
    0,
    -1
])("Não deve realizar um depósito com a quantity inválida", async (quantity: number) => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    expect(responseSignup.data.accountId).toBeDefined()

    const inputDeposit = {
        accountId: responseSignup.data.accountId,
        assetId: 'USD',
        quantity: quantity
    }
    const responseDeposit = await axios.post('http://localhost:3000/deposit', inputDeposit)
    const outputDeposit = responseDeposit.data;
    expect(responseDeposit.status).toBe(422);
    expect(outputDeposit.error).toBe("Invalid quantity");
})

test("Não deve realizar um depósito com a accountId inválida", async() => {
    const inputDeposit = {
        accountId: crypto.randomUUID(),
        assetId: 'USD',
        quantity: 10
    }
    const responseDeposit = await axios.post('http://localhost:3000/deposit', inputDeposit)
    const outputDeposit = responseDeposit.data;
    expect(responseDeposit.status).toBe(422);
    expect(outputDeposit.error).toBe("Invalid accountId");
})

test("Deve realizar um saque com sucesso", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    expect(responseSignup.data.accountId).toBeDefined()

    const inputDeposit = {
        accountId: responseSignup.data.accountId,
        assetId: 'BTC',
        quantity: 10
    }
    const responseDeposit = await axios.post('http://localhost:3000/deposit', inputDeposit)
    expect(responseDeposit.status).toBe(204)

    const inputWithdraw = {
        accountId: responseSignup.data.accountId,
        assetId: 'BTC',
        quantity: 10
    }
    const responseWithdraw = await axios.post('http://localhost:3000/withdraw', inputWithdraw)
    expect(responseWithdraw.status).toBe(204)
})

test("Não deve realizar um saque com o assetId inválido", async() => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    expect(responseSignup.data.accountId).toBeDefined()

    const inputWithdraw = {
        accountId: responseSignup.data.accountId,
        assetId: 'BRL',
        quantity: 10
    }
    const responseWithdraw = await axios.post('http://localhost:3000/withdraw', inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(422);
    expect(outputWithdraw.error).toBe("Invalid assetId");
})

test.each([
    0,
    -1,
    11
])("Não deve realizar um saque com a quantity inválida", async (quantity: number) => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    expect(responseSignup.data.accountId).toBeDefined()

    const inputDeposit = {
        accountId: responseSignup.data.accountId,
        assetId: 'USD',
        quantity: 10
    }
    const responseDeposit = await axios.post('http://localhost:3000/deposit', inputDeposit)
    expect(responseDeposit.status).toBe(204);

    const inputWithdraw = {
        accountId: responseSignup.data.accountId,
        assetId: 'USD',
        quantity: quantity
    }
    const responseWithdraw = await axios.post('http://localhost:3000/withdraw', inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(422)
    expect(outputWithdraw.error).toBe('Invalid quantity')
})

test("Não deve realizar um saque com a accountId inválida", async() => {
    const inputWithdraw = {
        accountId: crypto.randomUUID(),
        assetId: 'USD',
        quantity: 10
    }
    const responseWithdraw = await axios.post('http://localhost:3000/withdraw', inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(422);
    expect(outputWithdraw.error).toBe("Invalid accountId");
})

test("Não deve realizar um saque sem ter realizado um depósito", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    expect(responseSignup.data.accountId).toBeDefined()

    const inputWithdraw = {
        accountId: responseSignup.data.accountId,
        assetId: 'BTC',
        quantity: 10
    }
    const responseWithdraw = await axios.post('http://localhost:3000/withdraw', inputWithdraw)
    const outputWithdraw = responseWithdraw.data;
    expect(responseWithdraw.status).toBe(422);
    expect(outputWithdraw.error).toBe('Invalid withdraw')
})