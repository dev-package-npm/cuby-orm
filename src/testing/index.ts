import { TForeignKey } from "../core/mysql/interfaces/forge.interface";
import { EntityModel } from "../core/mysql/models/entity-model";
import { ClaveDiferenteModel } from "./models/clave-diferente.model";
import { NewtableModel } from "./models/newtable.model";
import { UserModel } from "./models/user.model";
import { Users1Model } from "./models/users1.model";

const userModel = new Users1Model();
const userModel2 = new NewtableModel()
const otra = new ClaveDiferenteModel();
const user = new UserModel();
const entityModel = new EntityModel('user');
const main = async () => {
    let transaction;
    try {
        transaction = await userModel.beginTransaction();
        await entityModel.read({ where: '' });
        // Create record
        // const user = await userModel.find({
        //     alias: { column: 'age', name: 'edad' },
        //     columns: ['active']
        // }).build();
        // console.log(user);
        // const result = await userModel.create({
        //     columns: ['first_name', 'last_name', 'user_name', 'age'],
        //     values: [
        //         { age: 10, first_name: 'Carlos Andres', last_name: JSON.stringify({ name: "jairo" }), user_name: 'CarlosV' },
        //         { age: 11, first_name: 'Carlos Andres', last_name: JSON.stringify({ name: "jairo" }), user_name: 'CarlosV' }
        //     ]
        // });
        // console.log(await result.getInsert());
        // const results = await otra.create({ columns: ['prueba'], values: { prueba: 'prueba' } });
        // console.log(await results.getInsert());
        // console.log(await result.getInsert());
        // TODO organizar método para que funcione los siguiente
        // const data = [
        //     ['1', 'hola2'],
        //     ['2', 'Hola1']
        // ]
        // await user.query('insert into newtable(id, prueba) values (?,?),(?,?)', [1, 'Hola1', 2, 'Hola2']);

        // const result = await userModel.create({ columns: ['last_name', 'user_name'], values: { last_name: '', user_name: 'JairoA' } });

        // console.log(await result.getValues());
        // const result2 = await userModel2.create({ columns: ['prueba', 'id'], values: { id: 1, prueba: 'Esto es una prueba' } });
        // console.log(await result2.getInsert());
        // throw new Error("Esto es una prueba de error");
        // await userModel.create({
        //     columns: ['first_name', 'last_name', 'user_name', 'age'],
        //     values: [
        //         { user_name: 'MigueG', age: 65, first_name: 'Miguel', last_name: 'Grueña Cardona' },
        //         { last_name: 'Piedraita Correa', user_name: 'AntonioP', age: 64, first_name: 'Antonio' }
        //     ]
        // });


        // console.log(result);
        // const result = await userModel.update({
        //     set: { age: 11, user_name: 'Carlos Mairio', first_name: 'Calitos' },
        //     where: {
        //         condition: { id: 155 }
        //     }
        // });
        // console.log(await result.getValues());
        // const results = await userModel.findId({ id: 109, columns: ['age', 'first_name'] });
        // console.log(results);
        // const result = await userModel.delete({});
        // console.log(result);
        // console.log(await userModel.getDatabaseName());
        // const user = await userModel.findAll();
        // console.log(user);
        // const user = await userModel.find({
        //     alias: { column: 'first_name', name: 'primer_nombre' },
        //     excludeColumns: ['first_name']
        // }).where({ id: 154 }).build();
        // console.log(user);

        await transaction?.commit();
    } catch (error: any) {
        await transaction?.rollback();
        console.log(error.message);
    }
}

main();