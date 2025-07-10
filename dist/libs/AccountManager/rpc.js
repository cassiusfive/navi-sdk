"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAVIHttpTransport = void 0;
const axios_1 = __importDefault(require("axios"));
const instance = axios_1.default.create({
    timeout: 20000,
});
instance.interceptors.response.use(function (response) {
    if (response.data.err) {
        throw new Error(response.data.err);
    }
    if (response.data.error) {
        throw new Error(response.data.error.message);
    }
    return response;
}, function (error) {
    return Promise.reject(error);
});
class NAVIHttpTransport {
    constructor(rpcUrl) {
        this.requestId = 0;
        this.rpcUrl = rpcUrl;
    }
    request(input) {
        return __awaiter(this, void 0, void 0, function* () {
            this.requestId += 1;
            const res = yield instance.post(this.rpcUrl, {
                jsonrpc: "2.0",
                id: this.requestId,
                method: input.method,
                params: input.params,
            });
            return res.data.result;
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("subscribe not implemented.");
        });
    }
}
exports.NAVIHttpTransport = NAVIHttpTransport;
