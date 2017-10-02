// this class couples models to the storage-class on the server and to an empty base-class in module-mode
class IntegrationBaseClass {
    constructor(className: string) {
    }

    public store(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            console.log("stored " + this.constructor.name)
            resolve();
        })
    }
}

let IntegrationBase;
if (process.argv.indexOf('module_mode') >= 0) {
    IntegrationBase = IntegrationBaseClass;
}
else {
    IntegrationBase = requireDynamically('../../../../../models/persistent/PersistentBase').PersistentBase;
    console.log(IntegrationBase)
}

function requireDynamically(path) {
    path = path.split('\\').join('/'); // Normalize windows slashes
    return eval(`require('${path}');`); // Ensure Webpack does not analyze the require statement
}

export class PersistentBase extends (IntegrationBase as { new(className: string): any; }) {
    constructor(className: string) {
        super(className)
    }
} 