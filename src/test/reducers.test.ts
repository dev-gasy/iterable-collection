import { describe, it, expect } from "vitest";
import { produce } from "immer";

import { partial } from "../partial/utils";
import type { BusinessEntity } from "../model/types";
import { Entity } from "../model/Entity";
import { Collection } from "../model/Collection";

type Reducer<State, Payload> = (state: State, payload: Payload) => State;

interface TodoData extends BusinessEntity {
  name: string;
  completed: boolean;
}

class TodoEntity extends Entity<TodoData> {
  get name(): string {
    return this.value?.name || "";
  }

  get completed(): boolean {
    return this.value?.completed || false;
  }
}

class TodoEntities extends Collection<TodoData, TodoEntity, BusinessEntity> {
  protected createEntity(data?: TodoData): TodoEntity {
    return new TodoEntity(data);
  }
}

type TodoEntitiesState = TodoEntities;

const addTodoReducer: Reducer<
  TodoEntitiesState,
  { name: string; id: string }
> = (state, payload) => {
  return state.push(partial({ _key: { id: payload.id }, name: payload.name }));
};

const toggleTodoReducer: Reducer<TodoEntitiesState, { id: string }> = (
  state,
  payload
) => {
  const items = produce(state.toDataArray(), (draft) => {
    const todo = draft.find((item) => item._key.id === payload.id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  });
  return state.create(items);
};

const removeTodoReducer: Reducer<TodoEntitiesState, { id: string }> = (
  state,
  payload
) => {
  return state.filter((entity) => entity.id() !== payload.id);
};

const updateTodoNameReducer: Reducer<
  TodoEntitiesState,
  { id: string; name: string }
> = (state, payload) => {
  const items = produce(state.toDataArray(), (draft) => {
    const todo = draft.find((item) => item._key.id === payload.id);
    if (todo) {
      todo.name = payload.name;
    }
  });
  return state.create(items);
};

const clearCompletedReducer: Reducer<TodoEntitiesState, void> = (state) => {
  return state.filter((entity) => !entity.completed);
};

const insertTodoAtReducer: Reducer<
  TodoEntitiesState,
  { index: number; name: string; id: string }
> = (state, payload) => {
  return state.insertAt(
    payload.index,
    partial({ _key: { id: payload.id }, name: payload.name })
  );
};

describe("Flux-style Entities reducers", () => {
  describe("addTodoReducer", () => {
    it("should add a new todo to empty Entities", () => {
      // Arrange
      const state = new TodoEntities();
      const payload = { name: "Learn reducers", id: "1" };

      // Act
      const newState = addTodoReducer(state, payload);

      // Assert
      expect(newState.length).toBe(1);
      expect(newState.at(0).name).toBe("Learn reducers");
      expect(newState.at(0).completed).toBe(false);
      expect(newState.at(0).id()).toBe("1");
      expect(newState).not.toBe(state);
    });

    it("should add a new todo to existing Entities", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({ _key: { id: "1" }, name: "First todo" }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { name: "Second todo", id: "2" };

      // Act
      const newState = addTodoReducer(state, payload);

      // Assert
      expect(newState.length).toBe(2);
      expect(newState.at(0).name).toBe("First todo");
      expect(newState.at(1).name).toBe("Second todo");
      expect(newState.at(1).id()).toBe("2");
    });
  });

  describe("toggleTodoReducer", () => {
    it("should toggle todo completion status", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "First todo",
          completed: false,
        }),
        partial<TodoData>({
          _key: { id: "2" },
          name: "Second todo",
          completed: true,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { id: "1" };

      // Act
      const newState = toggleTodoReducer(state, payload);

      // Assert
      expect(newState.at(0).completed).toBe(true);
      expect(newState.at(1).completed).toBe(true);
      expect(newState).not.toBe(state);
    });

    it("should not affect other todos", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "First todo",
          completed: false,
        }),
        partial<TodoData>({
          _key: { id: "2" },
          name: "Second todo",
          completed: true,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { id: "1" };

      // Act
      const newState = toggleTodoReducer(state, payload);

      // Assert
      expect(newState.at(1).name).toBe("Second todo");
      expect(newState.at(1).completed).toBe(true);
    });

    it("should return same Entities when id not found", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "First todo",
          completed: false,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { id: "999" };

      // Act
      const newState = toggleTodoReducer(state, payload);

      // Assert
      expect(newState.at(0).completed).toBe(false);
      expect(newState).not.toBe(state);
    });
  });

  describe("removeTodoReducer", () => {
    it("should remove todo by id", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "First todo",
          completed: false,
        }),
        partial<TodoData>({
          _key: { id: "2" },
          name: "Second todo",
          completed: true,
        }),
        partial<TodoData>({
          _key: { id: "3" },
          name: "Third todo",
          completed: false,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { id: "2" };

      // Act
      const newState = removeTodoReducer(state, payload);

      // Assert
      expect(newState.length).toBe(2);
      expect(newState.at(0).id()).toBe("1");
      expect(newState.at(1).id()).toBe("3");
      expect(newState).not.toBe(state);
    });

    it("should return same Entities when id not found", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "First todo",
          completed: false,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { id: "999" };

      // Act
      const newState = removeTodoReducer(state, payload);

      // Assert
      expect(newState.length).toBe(1);
      expect(newState.at(0).id()).toBe("1");
      expect(newState).not.toBe(state);
    });

    it("should handle empty Entities", () => {
      // Arrange
      const state = new TodoEntities();
      const payload = { id: "1" };

      // Act
      const newState = removeTodoReducer(state, payload);

      // Assert
      expect(newState.length).toBe(0);
      expect(newState).not.toBe(state);
    });
  });

  describe("updateTodoNameReducer", () => {
    it("should update todo name by id", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "Old name",
          completed: false,
        }),
        partial<TodoData>({
          _key: { id: "2" },
          name: "Another todo",
          completed: true,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { id: "1", name: "New name" };

      // Act
      const newState = updateTodoNameReducer(state, payload);

      // Assert
      expect(newState.at(0).name).toBe("New name");
      expect(newState.at(0).completed).toBe(false);
      expect(newState.at(1).name).toBe("Another todo");
      expect(newState).not.toBe(state);
    });

    it("should not affect completion status", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "Old name",
          completed: true,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { id: "1", name: "New name" };

      // Act
      const newState = updateTodoNameReducer(state, payload);

      // Assert
      expect(newState.at(0).completed).toBe(true);
    });

    it("should return same Entities when id not found", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "First todo",
          completed: false,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { id: "999", name: "New name" };

      // Act
      const newState = updateTodoNameReducer(state, payload);

      // Assert
      expect(newState.at(0).name).toBe("First todo");
      expect(newState).not.toBe(state);
    });
  });

  describe("clearCompletedReducer", () => {
    it("should remove all completed todos", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "Active todo",
          completed: false,
        }),
        partial<TodoData>({
          _key: { id: "2" },
          name: "Completed todo 1",
          completed: true,
        }),
        partial<TodoData>({
          _key: { id: "3" },
          name: "Another active",
          completed: false,
        }),
        partial<TodoData>({
          _key: { id: "4" },
          name: "Completed todo 2",
          completed: true,
        }),
      ];
      const state = new TodoEntities(initialData);

      // Act
      const newState = clearCompletedReducer(state);

      // Assert
      expect(newState.length).toBe(2);
      expect(newState.at(0).name).toBe("Active todo");
      expect(newState.at(1).name).toBe("Another active");
      expect(newState).not.toBe(state);
    });

    it("should return empty Entities when all todos are completed", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "Completed todo 1",
          completed: true,
        }),
        partial<TodoData>({
          _key: { id: "2" },
          name: "Completed todo 2",
          completed: true,
        }),
      ];
      const state = new TodoEntities(initialData);

      // Act
      const newState = clearCompletedReducer(state);

      // Assert
      expect(newState.length).toBe(0);
    });

    it("should return same Entities when no todos are completed", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "Active todo 1",
          completed: false,
        }),
        partial<TodoData>({
          _key: { id: "2" },
          name: "Active todo 2",
          completed: false,
        }),
      ];
      const state = new TodoEntities(initialData);

      // Act
      const newState = clearCompletedReducer(state);

      // Assert
      expect(newState.length).toBe(2);
      expect(newState.at(0).name).toBe("Active todo 1");
      expect(newState.at(1).name).toBe("Active todo 2");
      expect(newState).not.toBe(state);
    });

    it("should handle empty Entities", () => {
      // Arrange
      const state = new TodoEntities();

      // Act
      const newState = clearCompletedReducer(state);

      // Assert
      expect(newState.length).toBe(0);
      expect(newState).not.toBe(state);
    });
  });

  describe("insertTodoAtReducer", () => {
    it("should insert todo at specified index", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "First todo",
          completed: false,
        }),
        partial<TodoData>({
          _key: { id: "3" },
          name: "Third todo",
          completed: false,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { index: 1, name: "Second todo", id: "2" };

      // Act
      const newState = insertTodoAtReducer(state, payload);

      // Assert
      expect(newState.length).toBe(3);
      expect(newState.at(0).name).toBe("First todo");
      expect(newState.at(1).name).toBe("Second todo");
      expect(newState.at(2).name).toBe("Third todo");
      expect(newState).not.toBe(state);
    });

    it("should insert at beginning when index is 0", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "2" },
          name: "Second todo",
          completed: false,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { index: 0, name: "First todo", id: "1" };

      // Act
      const newState = insertTodoAtReducer(state, payload);

      // Assert
      expect(newState.length).toBe(2);
      expect(newState.at(0).name).toBe("First todo");
      expect(newState.at(1).name).toBe("Second todo");
    });

    it("should append when index exceeds length", () => {
      // Arrange
      const initialData = [
        partial<TodoData>({
          _key: { id: "1" },
          name: "First todo",
          completed: false,
        }),
      ];
      const state = new TodoEntities(initialData);
      const payload = { index: 10, name: "Last todo", id: "2" };

      // Act
      const newState = insertTodoAtReducer(state, payload);

      // Assert
      expect(newState.length).toBe(2);
      expect(newState.at(0).name).toBe("First todo");
      expect(newState.at(1).name).toBe("Last todo");
    });
  });
});
