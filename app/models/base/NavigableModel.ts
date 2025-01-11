import invariant from "invariant";
import { action, observable, runInAction } from "mobx";
import { NavigationNode } from "@shared/types";
import { client } from "~/utils/ApiClient";
import Document from "../Document";
import ParanoidModel from "./ParanoidModel";

export default abstract class NavigableModel extends ParanoidModel {
  private isFetching = false;

  /** The child documents structure of the model. */
  @observable
  documents?: NavigationNode[];

  /**
   * Fetches the child documents structure from the server.
   */
  fetchDocuments = async (documentId: string, options?: { force: boolean }) => {
    if (this.isFetching) {
      return;
    }

    if (this.documents && options?.force !== true) {
      return;
    }

    try {
      this.isFetching = true;
      const res = await client.post("/documents.documents", {
        id: documentId,
      });
      invariant(res?.data, "Data should be available");

      runInAction(`${NavigableModel.modelName}#fetchDocuments`, () => {
        this.documents = res.data;
      });
    } finally {
      this.isFetching = false;
    }
  };

  /**
   * Updates the document identified by the given id in the model in memory.
   * Does not update the document in the database.
   *
   * @param document The document properties stored in the model
   */
  @action
  updateDocument(
    document: Pick<Document, "id" | "title" | "url" | "color" | "icon">
  ) {
    if (!this.documents) {
      return;
    }

    const travelNodes = (nodes: NavigationNode[]) =>
      nodes.forEach((node) => {
        if (node.id === document.id) {
          node.color = document.color ?? undefined;
          node.icon = document.icon ?? undefined;
          node.title = document.title;
          node.url = document.url;
        } else {
          travelNodes(node.children);
        }
      });

    travelNodes(this.documents);
  }

  /**
   * Removes the document identified by the given id in the model in memory.
   * Does not remove the document from the database.
   *
   * @param documentId The id of the document to remove.
   */
  @action
  removeDocument(documentId: string) {
    if (!this.documents) {
      return;
    }

    this.documents = this.documents.filter(function f(node): boolean {
      if (node.id === documentId) {
        return false;
      }

      if (node.children) {
        node.children = node.children.filter(f);
      }

      return true;
    });
  }
}
