export class UtilService {
  static generate(length: number, chars?: string) {
    if (!chars) {
      chars = "0123456789";
    }
    let result = "";
    for (let i = length; i > 0; i -= 1) {
      result += chars[Math.round(Math.random() * (chars.length - 1))];
    }
    return result;
  }

  static formUrlEncoded(x: any): any {
    return Object.keys(x).reduce(
      (p, c) => `${p}&${c}=${encodeURIComponent(x[c])}`,
      ""
    );
  }

  static formatPhone(phonenumber: any): string {
    phonenumber.toString();
    if (phonenumber.startsWith("+")) phonenumber = phonenumber.slice(1);
    if (phonenumber.startsWith("234")) phonenumber = phonenumber.slice(3);
    if (phonenumber.startsWith("09")) phonenumber = phonenumber.slice(1);
    if (phonenumber.startsWith("07")) phonenumber = phonenumber.slice(1);
    if (phonenumber.startsWith("08")) phonenumber = phonenumber.slice(1);
    return phonenumber = `234${phonenumber}`
  }
}
