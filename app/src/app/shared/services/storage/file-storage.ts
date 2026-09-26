import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
export class FileStorage {
    databaseName: string = 'default';

    constructor() {
    }

    async setupPermisssions() {
        await Filesystem.requestPermissions();
    }

    async saveFile(fileName: string, data: any): Promise<void> {
        try {
            const jsonData = JSON.stringify(data, null, 2);
            await Filesystem.writeFile({
                path: fileName,
                data: jsonData, 
                directory: Directory.Data, // Directorio específico para data de la aplicación
                encoding: Encoding.UTF8,
            });
        } catch (e) {
            console.error('Error al guardar datos:', e);
            throw e;
        }
    }

    async readFile(fileName: string): Promise<any> {
        try {
            const ret = await Filesystem.readFile({
                path: fileName,
                directory: Directory.Data,
                encoding: Encoding.UTF8,
            });
            return JSON.parse(ret.data as string);
        } catch (e) {
            console.error('Error al leer datos:', e);
            // Puedes devolver un valor por defecto o lanzar el error según tu lógica
            return null;
        }
    }

    async checkFile(fileName: string): Promise<boolean> {
        try {
            const result = await Filesystem.stat({
                path: fileName,
                directory: Directory.Data,
            });
            return true; // El archivo existe
        } catch (e) {
            return false; // El archivo no existe
        }
    }

    async deleteFile(fileName: string): Promise<void> {
        try {
            await Filesystem.deleteFile({
                path: fileName,
                directory: Directory.Data,
            });
        } catch (e) {
            console.error('Error al eliminar archivo:', e);
            throw e;
        }
    }

    search(data: Array<any>, id: string, field = 'id') {
        if (!data.length) {
            console.error(`the data is empty`);
            return null;
        }
        const index = data.findIndex((i: any) => i[field] == id);
        if (index == -1) {
            console.error(`the item '${ id }' not exist in storage `);
            return null;
        }
        return data[index];
    }

    filter(data: any, id: string, field = 'id') {
        if (!data.length) {
            console.error(`the data is empty`);
            return null;
        }
        const list = data.filter((i: any) => i[field] == id);
        if (!list) {
            console.error(`the item '${ id }' not exist in storage `);
            return null;
        }
        return list;
    }

    save(data: any, value: any) {
        if (!data) {
            data = { data: [] };
        }
        data.data.push(value);
        return data;
    }

    update(data: any, id: string, newValue: any, field = 'id') {
        if (!data.length) {
            console.error(`the data is empty`);
            return null;
        }
        const index = data.findIndex((i: any) => i[field] == id);
        if (index == -1) {
            console.error(`the item '${ id }' not exist in storage `);
            return null;
        }

        data[index] = newValue;
        return data;
    }

    delete(data: any, id: string, field = 'id') {
        if (!data.length) {
            console.error(`the data is empty`);
            return null;
        }
        let filtered = data.filter((i: any) => i[field] != id);;
        return filtered;
    }
}
