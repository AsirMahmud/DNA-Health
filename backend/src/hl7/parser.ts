/**
 * Spec-Compliant HL7 v2 Message AST Parser
 * Avoids naive string regex splits; properly adheres to MSH encoding definitions,
 * segment delimiters, field separators, repetitions, components, and escape sequences.
 */

import {
  Hl7EncodingCharacters,
  Hl7Segment,
  Hl7Field,
  Hl7Component,
  ParsedHl7Message,
} from "./types.js";

export class Hl7Parser {
  /**
   * Parse an HL7 v2 message string into an AST structure.
   */
  public parse(rawMessage: string): ParsedHl7Message {
    const trimmed = rawMessage.trim();
    if (!trimmed.startsWith("MSH")) {
      throw new Error("Invalid HL7 v2 message: must begin with MSH segment");
    }

    // Determine field separator (character at position 3)
    const fieldSeparator = trimmed[3];
    // Next characters define component, repetition, escape, and subcomponent
    const encodingChars = trimmed.slice(4, 8);
    const encoding: Hl7EncodingCharacters = {
      fieldSeparator,
      componentSeparator: encodingChars[0] || "^",
      repetitionSeparator: encodingChars[1] || "~",
      escapeCharacter: encodingChars[2] || "\\",
      subcomponentSeparator: encodingChars[3] || "&",
    };

    // Split segments safely respecting \r\n, \r, or \n
    const rawSegments = trimmed.split(/\r\n|\r|\n/).filter((s) => s.trim().length > 0);

    const segments: Hl7Segment[] = rawSegments.map((segLine) =>
      this.parseSegment(segLine, encoding)
    );

    const msh = segments.find((s) => s.name === "MSH");
    if (!msh) {
      throw new Error("Missing MSH segment in HL7 message");
    }

    // In MSH:
    // field[1] is the field separator itself ('|')
    // field[2] is encoding characters ('^~\&')
    // field[3] is Sending Application
    // field[7] is Date/Time of message
    // field[9] is Message Type (e.g. RAS^O17)
    // field[10] is Message Control ID
    const senderApp = this.getFieldComponentValue(msh, 3, 1, encoding);
    const timestamp = this.getFieldComponentValue(msh, 7, 1, encoding);
    const msgTypeComposite = this.getFieldComponentValue(msh, 9, 1, encoding);
    const triggerEvent = this.getFieldComponentValue(msh, 9, 2, encoding);
    const fullMsgType = triggerEvent ? `${msgTypeComposite}^${triggerEvent}` : msgTypeComposite;
    const messageControlId = this.getFieldComponentValue(msh, 10, 1, encoding);

    return {
      raw: rawMessage,
      encoding,
      segments,
      messageType: fullMsgType,
      triggerEvent: triggerEvent || "",
      messageControlId,
      timestamp,
      senderApp,
    };
  }

  private parseSegment(line: string, encoding: Hl7EncodingCharacters): Hl7Segment {
    const isMsh = line.startsWith("MSH");
    const segName = line.slice(0, 3);
    const fields: Hl7Field[] = [];

    let fieldTokens: string[];
    if (isMsh) {
      // MSH is special: MSH-1 is fieldSeparator, MSH-2 is encodingChars
      fieldTokens = line.split(encoding.fieldSeparator);
      // fieldTokens[0] is "MSH"
      // fieldTokens[1] is encoding chars, which corresponds to MSH-2
      fields.push({ raw: encoding.fieldSeparator, repetitions: [[{ value: encoding.fieldSeparator, subcomponents: [] }]] }); // MSH-1
      fields.push({ raw: fieldTokens[1] || "", repetitions: [[{ value: fieldTokens[1] || "", subcomponents: [] }]] }); // MSH-2
      for (let i = 2; i < fieldTokens.length; i++) {
        fields.push(this.parseField(fieldTokens[i], encoding));
      }
    } else {
      fieldTokens = line.split(encoding.fieldSeparator);
      // fieldTokens[0] is the segment name (e.g. PID)
      for (let i = 1; i < fieldTokens.length; i++) {
        fields.push(this.parseField(fieldTokens[i], encoding));
      }
    }

    return {
      name: segName,
      raw: line,
      fields,
    };
  }

  private parseField(fieldStr: string, encoding: Hl7EncodingCharacters): Hl7Field {
    if (!fieldStr) {
      return { raw: "", repetitions: [] };
    }

    const repetitions = fieldStr.split(encoding.repetitionSeparator).map((rep) => {
      return rep.split(encoding.componentSeparator).map((comp) => {
        const subcomps = comp.split(encoding.subcomponentSeparator).map((s) =>
          this.unescape(s, encoding)
        );
        return {
          value: subcomps[0] || "",
          subcomponents: subcomps,
        };
      });
    });

    return {
      raw: fieldStr,
      repetitions,
    };
  }

  private unescape(val: string, encoding: Hl7EncodingCharacters): string {
    const esc = encoding.escapeCharacter;
    return val
      .replace(new RegExp(`\\${esc}F\\${esc}`, "g"), encoding.fieldSeparator)
      .replace(new RegExp(`\\${esc}S\\${esc}`, "g"), encoding.componentSeparator)
      .replace(new RegExp(`\\${esc}T\\${esc}`, "g"), encoding.subcomponentSeparator)
      .replace(new RegExp(`\\${esc}R\\${esc}`, "g"), encoding.repetitionSeparator)
      .replace(new RegExp(`\\${esc}E\\${esc}`, "g"), encoding.escapeCharacter);
  }

  /**
   * Helper to retrieve field value by 1-indexed field index and optional 1-indexed component index.
   */
  public getFieldComponentValue(
    segment: Hl7Segment,
    fieldIndex: number,
    componentIndex = 1,
    encoding: Hl7EncodingCharacters
  ): string {
    const field = segment.fields[fieldIndex - 1];
    if (!field || field.repetitions.length === 0) return "";
    const firstRep = field.repetitions[0];
    const comp = firstRep[componentIndex - 1];
    return comp ? comp.value : "";
  }
}

export const hl7Parser = new Hl7Parser();
