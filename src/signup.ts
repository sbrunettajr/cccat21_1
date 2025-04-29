import express, { Request, Response } from "express";
import crypto from "crypto";
import pgp from "pg-promise";
import { validateCpf } from "./validateCpf";

const app = express();
app.use(express.json());

// const accounts: any = [];
const connection = pgp()("postgres://postgres:123456@localhost:5432/app");

function isValidName (name: string) {
    return name.match(/[a-zA-Z] [a-zA-Z]+/);
}

function isValidEmail (email: string) {
    return email.match(/^(.+)\@(.+)$/);
}

function isValidPassword (password: string) {
    if (password.length < 8) return false;
    if (!password.match(/\d+/)) return false;
    if (!password.match(/[a-z]+/)) return false;
    if (!password.match(/[A-Z]+/)) return false;
    return true;
}

app.post("/signup", async (req: Request, res: Response) => {
    const input = req.body;
    if (!isValidName(input.name)) {
        return res.status(422).json({
            error: "Invalid name"
        });
    }
    if (!isValidEmail(input.email)) {
        return res.status(422).json({
            error: "Invalid email"
        });
    }
    if (!validateCpf(input.document)) {
        return res.status(422).json({
            error: "Invalid document"
        });
    }
    if (!isValidPassword(input.password)) {
        return res.status(422).json({
            error: "Invalid password"
        });
    }
    const accountId = crypto.randomUUID();
    const account = {
        accountId,
        name: input.name,
        email: input.email,
        document: input.document,
        password: input.password
    }
    // accounts.push(account);
    await connection.query("insert into ccca.account (account_id, name, email, document, password) values ($1, $2, $3, $4, $5)", [account.accountId, account.name, account.email, account.document, account.password]);
    res.json({
        accountId
    });
});

app.get("/accounts/:accountId", async (req: Request, res: Response) => {
    const accountId = req.params.accountId;
    // const account = accounts.find((account: any) => account.accountId === accountId);
    const [accountData] = await connection.query("select * from ccca.account where account_id = $1", [accountId]);
    res.json(accountData);
});

app.post('/deposit', async (req: Request, res: Response) => {
    const {
        accountId,
        assetId,
        quantity
    } = req.body

    if (!isValidAssetId(assetId)) {
        return res.status(422).json({
            error: 'Invalid assetId'
        })
    }

    if (quantity <= 0) {
        return res.status(422).json({
            error: 'Invalid quantity'
        })
    }

    const [accountData] = await connection.query("select * from ccca.account where account_id = $1", [accountId]);
    if (!accountData) {
        return res.status(422).json({
            error: 'Invalid accountId'
        })
    }

    await connection.query("insert into ccca.account_asset(account_id, asset_id, quantity) values ($1, $2, $3);", [accountId, assetId, quantity])

    return res.status(204).send()
})

export function isValidAssetId(assetId: string) {
    return assetId.match(/^(BTC|USD)$/);
}

app.post('/withdraw', async (req: Request, res: Response) => {
    const {
        accountId,
        assetId,
        quantity
    } = req.body

    if (!isValidAssetId(assetId)) {
        return res.status(422).json({
            error: 'Invalid assetId'
        })
    }

    if (quantity <= 0) {
        return res.status(422).json({
            error: 'Invalid quantity'
        })
    }

    const [accountData] = await connection.query("select * from ccca.account where account_id = $1", [accountId]);
    if (!accountData) {
        return res.status(422).json({
            error: 'Invalid accountId'
        })
    }

    const [accountAssetData] = await connection.query("select * from ccca.account_asset where account_id = $1 and asset_id = $2", [accountId, assetId])
    if (!accountAssetData) {
        return res.status(422).json({
            error: 'Invalid withdraw'
        })
    }

    if (accountAssetData.quantity < quantity) {
        return res.status(422).json({
            error: 'Invalid quantity'
        })
    }

    return res.status(204).send()
})

app.listen(3000);