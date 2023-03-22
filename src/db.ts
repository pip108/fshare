import { createPool, Pool, PoolConfig, PoolConnection } from "mariadb";

class FservDB {
    private pool: Pool;
    private _conn: PoolConnection | null = null;

    constructor(config: PoolConfig) {
        this.pool = createPool(config);
    }

    private async get_conn() {
        if (this._conn === null) {
            this._conn = await this.pool.getConnection();
        }
        return this._conn;
    }

    public async add_file(file: DbFile) {
        const conn = await this.get_conn();
        try {
            conn.beginTransaction();
            conn.query('insert into upload (filename, original_filename) values (?, ?)',
                 [file.filename, file.original_filename]);
            await conn.commit();
        } catch(e) {
            conn?.rollback();
            throw e;
        }
    }

    public async filename_exists(filename: string) {
        const conn = await this.get_conn();
        const result = await conn.query('select 1 from upload where filename = ?', [filename]);
        return result.length > 0 ? true : false;
    }

    public async get_files() {
        const conn = await this.get_conn();
        const qs = conn.queryStream('select filename, original_filename, timestamp from upload');
        const result: DbFile[] = [];
        try {
            for await (const f of qs) {
                result.push(f);
            }
        } catch (e) {
            qs.destroy();
            throw e;
        }
        return result;
    }
}

export interface DbFile {
    filename: string;
    original_filename: string;
    timestamp: Date;
}

let fserv_db: FservDB | null = null;
export default function database(config: PoolConfig) {
    if (fserv_db === null) {
        fserv_db = new FservDB(config);
    }
    return fserv_db;
}