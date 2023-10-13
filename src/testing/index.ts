import { Users1Model } from "./models/users1.model";

const userModel = new Users1Model();

const main = async () => {
    let transaction = await userModel.beginTransaction();
    try {
        // Create record
        // const user = await userModel.find({
        //     alias: { column: 'first_name', name: 'primer_nombre' },
        //     excludeColumns: ['first_name']
        // }).build();
        // const result = await userModel.create({
        //     columns: ['first_name', 'last_name', 'user_name', 'age'],
        //     values: { age: 7, first_name: 'Carlos Andres', last_name: JSON.stringify({ name: "jairo" }), user_name: 'CarlosV' }
        // });
        // throw new Error("Esto es una prueba de error");
        // await userModel.create({
        //     columns: ['first_name', 'last_name', 'user_name', 'age'],
        //     values: [
        //         { user_name: 'MigueG', age: 65, first_name: 'Miguel', last_name: 'Grueña Cardona' },
        //         { last_name: 'Piedraita Correa', user_name: 'AntonioP', age: 64, first_name: 'Antonio' }
        //     ]
        // });


        // console.log(result);
        const result = await userModel.update({
            set: { age: 11, user_name: 'Carlos Mairio', first_name: 'Calitos' },
            where: {
                condition: { id: 133 }
            }
        });
        // const results = await userModel.findId({ id: 109, columns: ['age', 'first_name'] });
        // console.log(results);
        // const result = await userModel.delete(111);
        // console.log(result);
        // console.log(await userModel.getDatabaseName());
        // const user = await userModel.findAll({ excludeColumns: ['id', 'age', 'last_name'] });
        // console.log(user[0].first_name);
        // const user = await userModel.find({
        //     alias: { column: 'first_name', name: 'primer_nombre' },
        //     excludeColumns: ['first_name']
        // }).build();
        // console.log(user[0]);
        await transaction.commit();
    } catch (error: any) {
        await transaction.rollback();
        console.log(error.message);
    }
}

main();


