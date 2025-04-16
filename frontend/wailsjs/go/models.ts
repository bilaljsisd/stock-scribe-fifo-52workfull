export namespace models {
	
	export class Product {
	    id: string;
	    name: string;
	    sku: string;
	    description: string;
	    units?: string;
	    currentStock: number;
	    averageCost: number;
	    createdAt: time.Time;
	    updatedAt: time.Time;
	
	    static createFrom(source: any = {}) {
	        return new Product(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.sku = source["sku"];
	        this.description = source["description"];
	        this.units = source["units"];
	        this.currentStock = source["currentStock"];
	        this.averageCost = source["averageCost"];
	        this.createdAt = this.convertValues(source["createdAt"], time.Time);
	        this.updatedAt = this.convertValues(source["updatedAt"], time.Time);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StockEntry {
	    id: string;
	    productId: string;
	    quantity: number;
	    remainingQuantity: number;
	    unitPrice: number;
	    entryDate: time.Time;
	    notes?: string;
	
	    static createFrom(source: any = {}) {
	        return new StockEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.productId = source["productId"];
	        this.quantity = source["quantity"];
	        this.remainingQuantity = source["remainingQuantity"];
	        this.unitPrice = source["unitPrice"];
	        this.entryDate = this.convertValues(source["entryDate"], time.Time);
	        this.notes = source["notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StockOutput {
	    id: string;
	    productId: string;
	    totalQuantity: number;
	    totalCost: number;
	    referenceNumber?: string;
	    outputDate: time.Time;
	    notes?: string;
	
	    static createFrom(source: any = {}) {
	        return new StockOutput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.productId = source["productId"];
	        this.totalQuantity = source["totalQuantity"];
	        this.totalCost = source["totalCost"];
	        this.referenceNumber = source["referenceNumber"];
	        this.outputDate = this.convertValues(source["outputDate"], time.Time);
	        this.notes = source["notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StockOutputLine {
	    id: string;
	    stockOutputId: string;
	    stockEntryId: string;
	    quantity: number;
	    unitPrice: number;
	
	    static createFrom(source: any = {}) {
	        return new StockOutputLine(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.stockOutputId = source["stockOutputId"];
	        this.stockEntryId = source["stockEntryId"];
	        this.quantity = source["quantity"];
	        this.unitPrice = source["unitPrice"];
	    }
	}
	export class Transaction {
	    id: string;
	    type: string;
	    productId: string;
	    quantity: number;
	    date: time.Time;
	    referenceId: string;
	    notes?: string;
	
	    static createFrom(source: any = {}) {
	        return new Transaction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.productId = source["productId"];
	        this.quantity = source["quantity"];
	        this.date = this.convertValues(source["date"], time.Time);
	        this.referenceId = source["referenceId"];
	        this.notes = source["notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace time {
	
	export class Time {
	
	
	    static createFrom(source: any = {}) {
	        return new Time(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

