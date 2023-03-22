import { randomBytes } from 'crypto';
import express from 'express';
import { stat } from 'fs/promises';

import multer from 'multer';
import path from 'path';
import database, { DbFile } from './db'

import * as config from './config.json';

const db = database(config.database);

const port = config.port || 8777;
const version = process.env.VERSION || 'dev';

function random_filename(ext: string) {
    return `${randomBytes(6).toString('base64url')}.${ext}`;
}

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, config.filelocation);
    },
    filename: async (_, file, cb) => {
        const parts = file.originalname.split('.');
        const ext = parts[parts.length -1];

        let unique = random_filename(ext);
        while ((await db.filename_exists(unique))) {
            unique = random_filename(ext);
        }
        file.filename = unique;
        cb(null, unique);
    }
});
const upload = multer({storage}).single('file');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(config.filelocation));

app.get('/', async (_, res) => {
    res.header('x-kmk-geh-version', version);
    res.sendFile(path.join(__dirname, 'static', 'index.htm'));
});

app.get('/v', (_, res) => res.send(version));

app.post('/u', upload, async (req, res) => {
    if (!req.file) {
        res.status(400).end();
        return;
    }
    const fn = req.file.filename;
    const ext_links = config.external.map(x => `https://${x}/${fn}`);
    const db_file: DbFile = {
        filename: req.file.filename,
        original_filename: req.file.originalname,
        timestamp: new Date()
    };
    await db.add_file(db_file);
    res.json({ filename: fn, external: ext_links });
});

app.get('/f/:fn', async (req, res) => {
    const fn = req.params['fn'];
    if (!fn) {
        res.status(400);
        res.end();
        return;
    }
    try {
        await stat(path.join(config.filelocation, fn));
    } catch {
        res.status(404).end();
        return;
    }
    res.sendFile(path.resolve(config.filelocation, fn));
});

app.get('*', (_, res) => {
    res.status(204).end();
});

process.on('SIGINT', () => process.exit(0));
app.listen(port, () => console.log(`http://localhost:${port}`));